package com.outamation.lossmitigation.controller;

import com.outamation.lossmitigation.model.*;
import com.outamation.lossmitigation.service.HardshipService;
import com.outamation.lossmitigation.service.LoanService;
import com.outamation.lossmitigation.service.WorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class LoanApiController {

    private final LoanService loanService;
    private final HardshipService hardshipService;
    private final WorkflowService workflowService;

    public LoanApiController(LoanService loanService, HardshipService hardshipService,
                              WorkflowService workflowService) {
        this.loanService = loanService;
        this.hardshipService = hardshipService;
        this.workflowService = workflowService;
    }

    @GetMapping("/workflow/steps")
    public ResponseEntity<List<WorkflowStep>> getWorkflowSteps() {
        return ResponseEntity.ok(workflowService.getAllSteps());
    }

    @GetMapping("/workflow/steps/{stepId}")
    public ResponseEntity<WorkflowStep> getWorkflowStep(@PathVariable int stepId) {
        WorkflowStep step = workflowService.getStepById(stepId);
        if (step != null) {
            return ResponseEntity.ok(step);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/loans/search")
    public ResponseEntity<List<LoanService.SearchResult>> searchLoans(@RequestParam String term) {
        List<LoanService.SearchResult> results = loanService.fuzzySearch(term);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/loans/{loanId}")
    public ResponseEntity<Loan> getLoan(@PathVariable String loanId) {
        Optional<Loan> loan = loanService.findByLoanId(loanId);
        return loan.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/loans/{loanId}/reinstatement")
    public ResponseEntity<ReinstatementBreakdown> getReinstatement(@PathVariable String loanId) {
        Optional<Loan> loan = loanService.findByLoanId(loanId);
        return loan.map(l -> ResponseEntity.ok(ReinstatementBreakdown.calculate(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/loans/{loanId}/repayment-plan")
    public ResponseEntity<RepaymentPlan> getRepaymentPlan(@PathVariable String loanId) {
        Optional<Loan> loan = loanService.findByLoanId(loanId);
        return loan.map(l -> ResponseEntity.ok(RepaymentPlan.calculate(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/loans/{loanId}/partial-claim")
    public ResponseEntity<PartialClaim> getPartialClaim(@PathVariable String loanId) {
        Optional<Loan> loan = loanService.findByLoanId(loanId);
        return loan.map(l -> ResponseEntity.ok(PartialClaim.evaluate(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/loans/{loanId}/modification-estimates")
    public ResponseEntity<List<ModificationEstimate>> getModificationEstimates(
            @PathVariable String loanId,
            @RequestParam(defaultValue = "false") boolean isDisaster) {
        Optional<Loan> loan = loanService.findByLoanId(loanId);
        return loan.map(l -> ResponseEntity.ok(ModificationEstimate.calculate(l, isDisaster)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/loans/{loanId}/eligibility/basic")
    public ResponseEntity<EligibilityResult> getBasicEligibility(@PathVariable String loanId) {
        Optional<Loan> loan = loanService.findByLoanId(loanId);
        return loan.map(l -> ResponseEntity.ok(EligibilityResult.basicEligibility(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/loans/{loanId}/eligibility/repayment")
    public ResponseEntity<EligibilityResult> getRepaymentEligibility(@PathVariable String loanId) {
        return ResponseEntity.ok(EligibilityResult.repaymentPlanEligibility());
    }

    @GetMapping("/loans/{loanId}/eligibility/forbearance")
    public ResponseEntity<EligibilityResult> getForbearanceEligibility(@PathVariable String loanId) {
        return ResponseEntity.ok(EligibilityResult.forbearanceEligibility());
    }

    @GetMapping("/loans/{loanId}/eligibility/modification")
    public ResponseEntity<EligibilityResult> getModificationEligibility(@PathVariable String loanId) {
        return ResponseEntity.ok(EligibilityResult.modificationEligibility());
    }

    @GetMapping("/hardship/reasons")
    public ResponseEntity<Map<String, List<HardshipReason>>> getHardshipReasons() {
        Map<String, List<HardshipReason>> result = new HashMap<>();
        result.put("temporary", hardshipService.getTemporaryReasons());
        result.put("permanent", hardshipService.getPermanentReasons());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/hardship/reason")
    public ResponseEntity<HardshipReason> getHardshipReason(
            @RequestParam String reason, @RequestParam String category) {
        HardshipReason hr = hardshipService.findReason(reason, category);
        if (hr != null) {
            return ResponseEntity.ok(hr);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/hardship/next-step")
    public ResponseEntity<Map<String, Object>> getHardshipNextStep(@RequestParam String category) {
        Map<String, Object> result = new HashMap<>();
        result.put("nextStep", hardshipService.getNextStepForHardshipType(category));
        result.put("hardshipType", "Temporary".equals(category) ? "Short-term" : "Long-term");
        return ResponseEntity.ok(result);
    }
}
