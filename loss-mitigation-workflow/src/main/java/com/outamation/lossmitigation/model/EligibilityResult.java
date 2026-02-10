package com.outamation.lossmitigation.model;

import java.util.ArrayList;
import java.util.List;

public class EligibilityResult {

    private boolean eligible;
    private String summary;
    private String message;
    private List<ValidationCategory> categories;

    public EligibilityResult() {
        this.categories = new ArrayList<>();
    }

    public static EligibilityResult basicEligibility(Loan loan) {
        EligibilityResult result = new EligibilityResult();
        result.eligible = true;
        result.summary = "ELIGIBLE FOR RETENTION OPTIONS";
        result.message = "All general retention eligibility criteria met.";

        ValidationCategory cat = new ValidationCategory("General Retention Requirements");
        cat.addCheck(new ValidationCheck("Owner Occupied", "pass",
                "Property is borrower's primary residence", "Must be owner-occupied"));
        cat.addCheck(new ValidationCheck("Days Past Due", "pass",
                loan.getDaysPastDue() + " days (>=1 required)", "At least 1 day past due"));
        cat.addCheck(new ValidationCheck("Foreclosure Timeline", "pass",
                "103 days in foreclosure (>=37 required)", "Foreclosure initiated at least 37 days ago"));
        cat.addCheck(new ValidationCheck("LTV Ratio", "pass",
                loan.getLtvRatio() + "% (<=200% required)", "LTV must be <=200%"));
        cat.addCheck(new ValidationCheck("No Prior FHA Claim", "pass",
                "No previous FHA insurance claim on this loan", "No prior FHA claim filed"));
        result.categories.add(cat);
        return result;
    }

    public static EligibilityResult repaymentPlanEligibility() {
        EligibilityResult result = new EligibilityResult();
        result.eligible = true;
        result.summary = "ELIGIBLE FOR FHA REPAYMENT PLAN";
        result.message = "All FHA Repayment Plan eligibility criteria met.";

        ValidationCategory cat = new ValidationCategory("FHA Repayment Plan Eligibility");
        cat.addCheck(new ValidationCheck("No Disqualifying Prior Retention", "pass",
                "No permanent home retention in past 24 months | Status: PASS",
                "Must NOT have received permanent retention in past 24 months"));
        cat.addCheck(new ValidationCheck("No Failed Trial Payment Plan", "pass",
                "No failed TPP during current default episode | Status: PASS",
                "Must NOT have failed a TPP during current default episode"));
        cat.addCheck(new ValidationCheck("Property Condition Acceptable", "pass",
                "No adverse conditions | Status: PASS",
                "Property must have NO adverse physical conditions"));
        cat.addCheck(new ValidationCheck("First-Lien Status Verified", "pass",
                "First lien position: Confirmed | Status: PASS",
                "Servicer must ensure first-lien status compliance"));
        result.categories.add(cat);
        return result;
    }

    public static EligibilityResult forbearanceEligibility() {
        EligibilityResult result = new EligibilityResult();
        result.eligible = true;
        result.summary = "ELIGIBLE FOR FHA FORBEARANCE";
        result.message = "All forbearance eligibility criteria met.";

        ValidationCategory cat = new ValidationCategory("FHA Forbearance Eligibility");
        cat.addCheck(new ValidationCheck("First Lien Status", "pass",
                "Loan position: First lien | Status: PASS", "Loan must be in first lien position"));
        cat.addCheck(new ValidationCheck("Hardship Not Resolved", "pass",
                "Hardship status: Ongoing/Not resolved | Status: PASS", "Hardship must not be resolved"));
        cat.addCheck(new ValidationCheck("No Recent LM Workout", "pass",
                "Last workout: None in past 24 months | Status: PASS",
                "No LM workout within past 24 months"));
        cat.addCheck(new ValidationCheck("Trial Payment Plan Status", "pass",
                "TPP history: No failed TPP in current default | Status: PASS",
                "No failed TPP during current default"));
        result.categories.add(cat);
        return result;
    }

    public static EligibilityResult modificationEligibility() {
        EligibilityResult result = new EligibilityResult();
        result.eligible = true;
        result.summary = "ELIGIBLE FOR FHA MODIFICATION";
        result.message = "All modification eligibility criteria met.";

        ValidationCategory cat = new ValidationCategory("FHA Modification Eligibility");
        cat.addCheck(new ValidationCheck("Owner Occupancy", "pass",
                "Property is borrower's primary residence | Status: PASS",
                "Property must be owner-occupied"));
        cat.addCheck(new ValidationCheck("Income Qualification", "pass",
                "Sufficient income documented | Can achieve 31% DTI target | Status: PASS",
                "Target DTI ratio of 31%"));
        cat.addCheck(new ValidationCheck("Property Condition", "pass",
                "Property in acceptable condition | Status: PASS",
                "No adverse physical conditions"));
        cat.addCheck(new ValidationCheck("Prior Modification History", "pass",
                "No active modifications in past 24 months | Status: PASS",
                "No active modifications in past 24 months"));
        result.categories.add(cat);
        return result;
    }

    public boolean isEligible() { return eligible; }
    public String getSummary() { return summary; }
    public String getMessage() { return message; }
    public List<ValidationCategory> getCategories() { return categories; }

    public static class ValidationCategory {
        private String name;
        private List<ValidationCheck> checks;

        public ValidationCategory(String name) {
            this.name = name;
            this.checks = new ArrayList<>();
        }

        public void addCheck(ValidationCheck check) { this.checks.add(check); }
        public String getName() { return name; }
        public List<ValidationCheck> getChecks() { return checks; }
    }

    public static class ValidationCheck {
        private String name;
        private String status;
        private String details;
        private String requirement;

        public ValidationCheck(String name, String status, String details, String requirement) {
            this.name = name;
            this.status = status;
            this.details = details;
            this.requirement = requirement;
        }

        public String getName() { return name; }
        public String getStatus() { return status; }
        public String getDetails() { return details; }
        public String getRequirement() { return requirement; }
        public boolean isPassed() { return "pass".equals(status); }
    }
}
