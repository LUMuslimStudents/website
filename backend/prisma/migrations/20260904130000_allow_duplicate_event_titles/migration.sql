-- Revert of 20260415143000_make_event_title_unique:
-- events_info.title is no longer globally unique (events are unique by
-- (term, title) instead).
ALTER TABLE `events_info`
DROP INDEX `title`;
