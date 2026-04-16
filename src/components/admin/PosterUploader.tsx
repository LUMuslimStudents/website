import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ImagePlus, Plus, X } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp,image/gif";
const DEFAULT_MAX_FILES = 10;

type PosterUploaderProps = {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
};

type SortableThumbProps = {
  id: string;
  previewUrl: string;
  index: number;
  isActive: boolean;
  onSelect: (index: number) => void;
  onRemove: (index: number) => void;
};

const SortableThumb = ({ id, previewUrl, index, isActive, onSelect, onRemove }: SortableThumbProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`relative flex-shrink-0 rounded-xl border bg-white/95 dark:bg-slate-950/90 ${
        isActive
          ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900/60"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
      } ${isDragging ? "opacity-70" : "opacity-100"} cursor-grab active:cursor-grabbing`}
    >
      <button
        type="button"
        onClick={() => onSelect(index)}
        className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[10px] bg-slate-100 dark:bg-slate-900"
        aria-label={`Preview image ${index + 1}`}
      >
        <img src={previewUrl} alt={`Poster thumbnail ${index + 1}`} className="h-full w-full object-cover" />
      </button>

      <button
        type="button"
        className="absolute right-1 top-1 rounded-full border border-red-200 bg-white p-1 text-red-500 shadow-sm transition-colors hover:text-red-700 dark:border-red-900/60 dark:bg-slate-950 dark:text-red-300 dark:hover:text-red-200"
        aria-label={`Remove image ${index + 1}`}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onRemove(index);
        }}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};

export const PosterUploader = ({ files, onChange, maxFiles = DEFAULT_MAX_FILES }: PosterUploaderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileIdsRef = useRef(new WeakMap<File, string>());
  const fileIdSeedRef = useRef(0);

  const getFileId = (file: File) => {
    const existing = fileIdsRef.current.get(file);
    if (existing) {
      return existing;
    }

    const nextId = `poster-file-${Date.now()}-${fileIdSeedRef.current}`;
    fileIdSeedRef.current += 1;
    fileIdsRef.current.set(file, nextId);
    return nextId;
  };

  const posterItems = useMemo(() => {
    return files.map((file) => ({
      id: getFileId(file),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
  }, [files]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  useEffect(() => {
    return () => {
      posterItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [posterItems]);

  useEffect(() => {
    if (posterItems.length === 0 && currentIndex !== 0) {
      setCurrentIndex(0);
      return;
    }

    if (currentIndex >= posterItems.length && posterItems.length > 0) {
      setCurrentIndex(posterItems.length - 1);
    }
  }, [currentIndex, posterItems.length]);

  const appendFiles = (incoming: File[]) => {
    const imageFiles = incoming.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      toast.error("Please upload image files only.");
      return;
    }

    const availableSlots = Math.max(maxFiles - files.length, 0);
    const accepted = imageFiles.slice(0, availableSlots);

    if (accepted.length === 0) {
      toast.warning(`Maximum of ${maxFiles} images reached.`);
      return;
    }

    onChange([...files, ...accepted]);

    if (accepted.length < imageFiles.length) {
      toast.warning(`Only ${maxFiles} images are allowed.`);
    }
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    appendFiles(selectedFiles);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
    appendFiles(Array.from(event.dataTransfer.files ?? []));
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);
  };

  const removeAt = (index: number) => {
    onChange(files.filter((_, current) => current !== index));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = posterItems.findIndex((item) => item.id === active.id);
    const newIndex = posterItems.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) return;

    onChange(arrayMove(files, oldIndex, newIndex));

    setCurrentIndex((current) => {
      if (current === oldIndex) return newIndex;
      if (oldIndex < current && current <= newIndex) return current - 1;
      if (newIndex <= current && current < oldIndex) return current + 1;
      return current;
    });
  };

  const showNavigator = posterItems.length > 1;
  const activePoster = posterItems[currentIndex];
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < posterItems.length - 1;

  return (
    <div className="flex h-full flex-col">
      <div
        className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-200 via-slate-100 to-white transition-all duration-200 dark:border-slate-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 ${
          isDraggingOver ? "ring-2 ring-blue-500 ring-offset-1" : ""
        }`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <button
          type="button"
          className="relative block aspect-square w-full"
          onClick={() => fileInputRef.current?.click()}
          aria-label="Upload posters"
        >
          {activePoster ? (
            <img
              src={activePoster.previewUrl}
              alt={`Event poster ${currentIndex + 1}`}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm">Drop images here or click to upload</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/5" />
        </button>

        {showNavigator && (
          <>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="absolute left-2 top-1/2 z-10 rounded-full border border-white/40 bg-black/45 text-white shadow-md backdrop-blur-sm opacity-0 transition-all duration-200 hover:bg-black/70 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0 group-hover:disabled:opacity-35"
              style={{ transform: "translateY(-50%)" }}
              disabled={!canGoPrev}
              aria-label="Previous image"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!canGoPrev) return;
                setCurrentIndex((index) => Math.max(index - 1, 0));
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="absolute right-2 top-1/2 z-10 rounded-full border border-white/40 bg-black/45 text-white shadow-md backdrop-blur-sm opacity-0 transition-all duration-200 hover:bg-black/70 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-0 group-hover:disabled:opacity-35"
              style={{ transform: "translateY(-50%)" }}
              disabled={!canGoNext}
              aria-label="Next image"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!canGoNext) return;
                setCurrentIndex((index) => Math.min(index + 1, posterItems.length - 1));
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple
          onChange={onFileInputChange}
          className="hidden"
          aria-label="Upload event posters"
        />
      </div>

      <div className="flex flex-col gap-3 px-2 pt-3">
        <div className="flex flex-wrap items-center gap-2">
          {posterItems.length > 1 && (
            <span className="text-xs text-slate-500">{currentIndex + 1} / {posterItems.length}</span>
          )}
        </div>

        {posterItems.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={posterItems.map((item) => item.id)} strategy={horizontalListSortingStrategy}>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {posterItems.map((item, index) => (
                  <SortableThumb
                    key={item.id}
                    id={item.id}
                    previewUrl={item.previewUrl}
                    index={index}
                    isActive={index === currentIndex}
                    onSelect={setCurrentIndex}
                    onRemove={removeAt}
                  />
                ))}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-sm transition-shadow duration-200 hover:shadow-md"
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Add images"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add images (multiple selection allowed)</TooltipContent>
                </Tooltip>
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
