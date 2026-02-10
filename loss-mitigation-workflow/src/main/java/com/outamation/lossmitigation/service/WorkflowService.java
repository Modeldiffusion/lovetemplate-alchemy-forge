package com.outamation.lossmitigation.service;

import com.outamation.lossmitigation.model.WorkflowStep;
import com.outamation.lossmitigation.model.WorkflowStep.Decision;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class WorkflowService {

    private final List<WorkflowStep> steps;
    private final Map<Integer, Integer> stepIdToIndex;

    public WorkflowService() {
        this.steps = new ArrayList<>();
        this.stepIdToIndex = new HashMap<>();
        initializeSteps();
    }

    public List<WorkflowStep> getAllSteps() {
        return Collections.unmodifiableList(steps);
    }

    public WorkflowStep getStepByIndex(int index) {
        if (index >= 0 && index < steps.size()) {
            return steps.get(index);
        }
        return null;
    }

    public WorkflowStep getStepById(int stepId) {
        Integer index = stepIdToIndex.get(stepId);
        if (index != null) {
            return steps.get(index);
        }
        return null;
    }

    public int getIndexForStepId(int stepId) {
        return stepIdToIndex.getOrDefault(stepId, -1);
    }

    public int getTotalSteps() {
        return steps.size();
    }

    private void initializeSteps() {
        addStep(1, "Fetch Loan Details", "fetch", true, false, false,
                null, "POST /api/v1/loans/search",
                List.of("Provide agent name and company name",
                        "Deliver call recording disclosure",
                        "State Mini-Miranda / FDCPA disclosure",
                        "Collect search criteria",
                        "Search loan database",
                        "Verify correct loan selected",
                        "Confirm speaking with authorized borrower",
                        "Verify borrower identity",
                        "State account status",
                        "Explain purpose of call",
                        "Confirm borrower occupancy status"));

        addStep(2, "Check Active LM", "decision", false, false, false,
                List.of(new Decision("ACTIVE APPLICATION FOUND", 18),
                        new Decision("NO ACTIVE APPLICATION", 3)),
                "GET /api/v1/lossmitig/applications/{loanId}",
                List.of("Run automated system check for active applications",
                        "Review application status",
                        "IF ACTIVE: Note application type and submission date",
                        "IF NO ACTIVE: Confirm ready to start new evaluation"));

        addStep(3, "Eligibility Factors", "validation", false, true, false,
                null, "POST /api/v1/eligibility/evaluate",
                List.of("Ask if property is primary residence",
                        "Verify property type",
                        "Run automated eligibility checks",
                        "Review validation results with borrower"));

        addStep(4, "Retention Eligibility", "validation", false, true, false,
                null, "POST /api/v1/retention/check-eligibility",
                List.of("Verify owner occupancy",
                        "Check foreclosure timeline",
                        "Check LTV ratio",
                        "Verify no prior FHA claim"));

        addStep(5, "Reinstatement Option", "decision", false, false, false,
                List.of(new Decision("YES - Can Reinstate", 6),
                        new Decision("NO - Cannot Reinstate", 7)),
                "GET /api/v1/reinstatement/calculate",
                List.of("Calculate total reinstatement amount",
                        "Break down all components",
                        "Present payment deadline",
                        "Ask if borrower can pay full amount"));

        WorkflowStep paymentStep = addStep(6, "Process Payment", "action", false, false, true,
                null, "POST /api/v1/payments/process",
                List.of("Verify reinstatement amount",
                        "Present payment method options",
                        "Provide wire transfer instructions",
                        "Process payment",
                        "Generate confirmation number"));
        paymentStep.setEndStateType("payment-collection");

        addStep(7, "Retention Intent", "decision", false, false, false,
                List.of(new Decision("YES - Keep Property", 8),
                        new Decision("NO - Liquidate", 19)),
                "POST /api/v1/borrower/capture-intent",
                List.of("Document borrower intent", "Update case notes"));

        addStep(8, "Hardship Resolution Check", "decision", false, false, false,
                List.of(new Decision("YES - Hardship Resolved", 9),
                        new Decision("NO - Hardship Ongoing", 24)),
                "POST /api/v1/hardship/check-resolution",
                List.of("Ask if hardship has been resolved",
                        "Document resolution status"));

        addStep(24, "Reason for Default", "capture", false, false, false,
                null, "POST /api/v1/hardship/capture-details",
                List.of("Select specific reason for default",
                        "System auto-determines hardship type",
                        "Ask and document all 4 customized questions",
                        "System auto-routes based on hardship type"));
        steps.get(steps.size() - 1).setShowHardshipCapture(true);

        addStep(9, "Surplus Income", "decision", false, false, false,
                List.of(new Decision("YES - Can Pay More", 11),
                        new Decision("NO - Cannot Pay More", 10)),
                null,
                List.of("Verify income improvement", "Assess surplus capacity"));

        addStep(10, "Collect Income", "info", false, true, false,
                null, "POST /api/v1/income/capture",
                List.of("Capture employment details",
                        "Document monthly income",
                        "Request income verification"));

        addStep(11, "Repayment Plan Eligibility", "validation", false, false, false,
                List.of(new Decision("ELIGIBLE - Present RPP Terms", 20, true),
                        new Decision("NOT ELIGIBLE - Alternative Options", 12, false)),
                "POST /api/v1/repaymentplan/check-eligibility",
                List.of("Verify no permanent retention in past 24 months",
                        "Verify no failed TPP",
                        "Confirm property condition",
                        "Verify first-lien status"));

        addStep(12, "Hardship Duration", "decision", false, false, false,
                List.of(new Decision("SHORT-TERM", 13),
                        new Decision("LONG-TERM", 14)),
                null,
                List.of("Classify hardship duration", "Document expectations"));

        addStep(13, "Forbearance Eligibility", "validation", false, false, false,
                List.of(new Decision("ELIGIBLE - Present Forbearance Options", 21, true),
                        new Decision("NOT ELIGIBLE - Alternative Options", 14, false)),
                "POST /api/v1/forbearance/check-eligibility",
                List.of("Verify first lien status",
                        "Confirm hardship not resolved",
                        "Check no recent LM workout",
                        "Verify no failed TPP"));

        addStep(14, "Payment Affordability", "decision", false, false, false,
                List.of(new Decision("YES - Can Afford", 15),
                        new Decision("NO - Need Reduction", 25)),
                null,
                List.of("Assess current payment capacity", "Calculate DTI ratio"));

        addStep(25, "Modification Eligibility", "validation", false, false, false,
                List.of(new Decision("ELIGIBLE - Continue to Modification", 16, true),
                        new Decision("NOT ELIGIBLE - Route to Liquidation", 19, false)),
                "POST /api/v1/modification/validate-eligibility",
                List.of("Verify property is owner-occupied",
                        "Check payment history",
                        "Confirm sufficient income",
                        "Verify property condition"));

        addStep(15, "Partial Claim", "decision", false, false, false,
                List.of(new Decision("ACCEPT Partial Claim", 22),
                        new Decision("DECLINE", 16)),
                "POST /api/v1/partialclaim/check-eligibility",
                List.of("Calculate PC amount",
                        "Verify < 30% UPB",
                        "Check DTI after PC"));

        addStep(16, "Modification Estimates", "info", false, true, false,
                null, "POST /api/v1/modification/check-eligibility",
                List.of("Display FHA modification waterfall programs",
                        "Calculate estimated payments",
                        "Explain waterfall order",
                        "Explain Trial Payment Plan requirement"));

        WorkflowStep modSubmitStep = addStep(17, "Submit to Mod Team", "action", false, false, true,
                null, "POST /api/v1/modification/submit-application",
                List.of("Generate confirmation number",
                        "Assign to specialist queue",
                        "Send acknowledgment"));
        modSubmitStep.setEndStateType("pending");

        WorkflowStep lmStatusStep = addStep(18, "Display LM Status", "info", false, false, true,
                null, "GET /api/v1/lossmitig/applications/{id}/details",
                List.of("Retrieve current application status",
                        "Check for pending documents",
                        "Provide expected decision date",
                        "Answer borrower questions"));
        lmStatusStep.setEndStateType("info");

        WorkflowStep liquidationStep = addStep(19, "Liquidation Options", "action", false, false, true,
                null, "POST /api/v1/liquidation/evaluate-options",
                List.of("Explain FHA liquidation waterfall",
                        "Detail Short Sale option",
                        "Detail Deed-in-Lieu option",
                        "Explain application requirement",
                        "Document borrower's selected option"));
        liquidationStep.setEndStateType("liquidation");

        addStep(20, "Repayment Plan Acceptance", "decision", false, false, false,
                List.of(new Decision("YES - Accept RPP", 22, true),
                        new Decision("NO - Can't Afford", 12, false)),
                "POST /api/v1/repaymentplan/present-terms",
                List.of("Review complete RPP terms with borrower",
                        "Confirm borrower understands total payment",
                        "Verify borrower can afford plan"));

        WorkflowStep forbSetupStep = addStep(21, "Forbearance Setup", "action", false, false, true,
                null, "POST /api/v1/forbearance/create",
                List.of("Calculate forbearance period",
                        "Review terms with borrower",
                        "Send forbearance agreement",
                        "Schedule review date",
                        "Suspend foreclosure"));
        forbSetupStep.setEndStateType("success");

        WorkflowStep rppSetupStep = addStep(22, "Repayment Plan Setup", "action", false, false, true,
                null, "POST /api/v1/repaymentplan/create",
                List.of("Confirm borrower acceptance",
                        "Generate repayment plan agreement",
                        "Set up auto-pay if requested",
                        "Calculate first payment date",
                        "Suspend foreclosure"));
        rppSetupStep.setEndStateType("success");

        WorkflowStep modSubmissionStep = addStep(23, "Modification Submission", "action", false, false, true,
                null, "POST /api/v1/modification/submit-application",
                List.of("Verify all required documents",
                        "Submit application to underwriting",
                        "Generate confirmation number",
                        "Assign modification specialist",
                        "Suspend foreclosure"));
        modSubmissionStep.setEndStateType("pending");
    }

    private WorkflowStep addStep(int id, String name, String type, boolean showSearch,
                                  boolean autoAdvance, boolean endState,
                                  List<Decision> decisions, String apiEndpoint,
                                  List<String> checklist) {
        WorkflowStep step = new WorkflowStep();
        step.setId(id);
        step.setName(name);
        step.setType(type);
        step.setShowSearchInterface(showSearch);
        step.setAutoAdvance(autoAdvance);
        step.setEndState(endState);
        step.setDecisions(decisions);
        step.setApiEndpoint(apiEndpoint);
        step.setChecklist(checklist);

        // Set icons based on step id
        Map<Integer, String> icons = Map.ofEntries(
                Map.entry(1, "&#128269;"), Map.entry(2, "&#128203;"),
                Map.entry(3, "&#10003;"), Map.entry(4, "&#127968;"),
                Map.entry(5, "&#128176;"), Map.entry(6, "&#128179;"),
                Map.entry(7, "&#127919;"), Map.entry(8, "&#128269;"),
                Map.entry(9, "&#128181;"), Map.entry(10, "&#128221;"),
                Map.entry(11, "&#128197;"), Map.entry(12, "&#9201;"),
                Map.entry(13, "&#9199;"), Map.entry(14, "&#128178;"),
                Map.entry(15, "&#128279;"), Map.entry(16, "&#128202;"),
                Map.entry(17, "&#128228;"), Map.entry(18, "&#8505;"),
                Map.entry(19, "&#127960;"), Map.entry(20, "&#9989;"),
                Map.entry(21, "&#9199;"), Map.entry(22, "&#128203;"),
                Map.entry(23, "&#128228;"), Map.entry(24, "&#128202;"),
                Map.entry(25, "&#9989;")
        );
        step.setIcon(icons.getOrDefault(id, "&#9679;"));

        int index = steps.size();
        steps.add(step);
        stepIdToIndex.put(id, index);
        return step;
    }
}
