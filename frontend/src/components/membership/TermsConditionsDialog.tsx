import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChevronDown, List } from 'lucide-react';

interface TermsConditionsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    refundPolicy: boolean;
    onRefundPolicyChange: (accepted: boolean) => void;
    GDPRTerm: boolean;
    onGDPRTermChange: (accepted: boolean) => void;
    onAccept: () => void;
    loading?: boolean;
}

export const TermsConditionsDialog = ({
    open,
    onOpenChange,
    refundPolicy,
    onRefundPolicyChange,
    GDPRTerm,
    onGDPRTermChange,
    onAccept,
    loading = false,
}: TermsConditionsDialogProps) => {
    const [expandedCondition, setExpandedCondition] = useState<string | null>(null);
    const allConditionsAccepted = refundPolicy && GDPRTerm;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl flex flex-col max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Terms & Conditions</DialogTitle>
                    <DialogDescription>
                        Please read and accept the following conditions to proceed with your signup.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-y-auto flex-1">
                    {/* Condition 1 */}
                    <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Checkbox 
                                checked={refundPolicy} 
                                onCheckedChange={onRefundPolicyChange}
                            />
                            <button
                                onClick={() => setExpandedCondition(expandedCondition === 'condition-1' ? null : 'condition-1')}
                                className="flex items-center gap-2 flex-1 text-left font-medium hover:text-primary transition-colors"
                            >
                                <span>No refunds can be made for the membership fee, regardless of inactivity.</span>
                                <ChevronDown 
                                    size={18} 
                                    className={`flex-shrink-0 transition-transform ${expandedCondition === 'condition-1' ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>
                        {expandedCondition === 'condition-1' && (
                            <p className="text-sm text-muted-foreground ml-7">
                                Even if a participant has paid the membership fee and does not attend any activities at all, the membership fee cannot be refunded.
                            </p>
                        )}
                    </div>

                    {/* Condition 2 */}
                    <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Checkbox 
                                checked={GDPRTerm} 
                                onCheckedChange={onGDPRTermChange}
                            />
                            <button
                                onClick={() => setExpandedCondition(expandedCondition === 'condition-2' ? null : 'condition-2')}
                                className="flex items-center gap-2 flex-1 text-left font-medium hover:text-primary transition-colors"
                            >
                                <span>In accordance with the General Data Protection Regulation (GDPR), personal and financial data collected will be handled securely, respecting members' privacy and rights</span>
                                <ChevronDown 
                                    size={18} 
                                    className={`flex-shrink-0 transition-transform ${expandedCondition === 'condition-2' ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>
                        {expandedCondition === 'condition-2' && (
                            <div className="text-sm text-muted-foreground ml-7">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>We, LUMS, process your personal data for the purpose of administering your participation in our events. Your information is used to organize events and communicate with you.</li>
                                    <li><strong>Storage period:</strong> 1 year from start of membership.</li>
                                    <li><strong>Rights:</strong> You can request access, rectification, deletion of your data, or object to the processing. Consent can be withdrawn if given.</li>
                                    <li><strong>Contact:</strong> For questions or to exercise your rights, contact <a className="text-primary hover:underline" href="mailto:muslimskastudenterlu@gmail.com">muslimskastudenterlu@gmail.com</a> </li>
                                    <li>Your participation implies consent to this processing.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button 
                        variant="outline" 
                        onClick={() => onOpenChange(false)}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={onAccept}
                        disabled={!allConditionsAccepted || loading}
                        className="flex-1"
                    >
                        {loading ? 'Creating account...' : 'Accept & Continue'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
