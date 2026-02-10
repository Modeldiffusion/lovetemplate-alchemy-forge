package com.outamation.lossmitigation.model;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class ModificationEstimate {

    private String category;
    private List<ModOption> options;

    public ModificationEstimate() {
        this.options = new ArrayList<>();
    }

    public static List<ModificationEstimate> calculate(Loan loan, boolean isDisaster) {
        List<ModificationEstimate> estimates = new ArrayList<>();
        BigDecimal currentPayment = loan.getMonthlyPayment();
        BigDecimal income = new BigDecimal("4800");
        BigDecimal targetPayment = income.multiply(new BigDecimal("0.31")).setScale(0, java.math.RoundingMode.HALF_UP);
        BigDecimal maxPC = loan.getUnpaidPrincipal().multiply(new BigDecimal("0.30")).min(loan.getTotalDelinquency());

        String prefix = isDisaster ? "FHA Disaster" : "FHA";
        ModificationEstimate est = new ModificationEstimate();
        est.category = prefix + " Modification Programs";

        est.options.add(new ModOption(
                prefix + " Standalone Loan Modification 30 Year",
                "Capitalize arrears, reduce rate to current market rate, extend to 30 years",
                new BigDecimal("6.00"), 360, new BigDecimal("1850"),
                currentPayment.subtract(new BigDecimal("1850")),
                false, null, false, null));

        est.options.add(new ModOption(
                prefix + " Standalone Loan Modification 40 Year",
                "Capitalize arrears, reduce rate to current market rate, extend to 40 years",
                new BigDecimal("6.00"), 480, new BigDecimal("1620"),
                currentPayment.subtract(new BigDecimal("1620")),
                false, null, false, null));

        est.options.add(new ModOption(
                prefix + " Loan Modification and Partial Claim 30 Year",
                "Partial claim on arrears (up to 30% UPB), modify to 30 years",
                new BigDecimal("6.00"), 360, new BigDecimal("1750"),
                currentPayment.subtract(new BigDecimal("1750")),
                true, maxPC, false, null));

        est.options.add(new ModOption(
                prefix + " Loan Modification and Partial Claim 40 Year",
                "Partial claim on arrears (up to 30% UPB), modify to 40 years",
                new BigDecimal("6.00"), 480, new BigDecimal("1520"),
                currentPayment.subtract(new BigDecimal("1520")),
                true, maxPC, false, null));

        BigDecimal supplementAmount = currentPayment.subtract(targetPayment);
        est.options.add(new ModOption(
                prefix + " Payment Supplement",
                "HUD provides monthly payment assistance to achieve affordability",
                loan.getInterestRate(), 0, targetPayment,
                currentPayment.subtract(targetPayment),
                false, null, true, supplementAmount));

        estimates.add(est);
        return estimates;
    }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public List<ModOption> getOptions() { return options; }
    public void setOptions(List<ModOption> options) { this.options = options; }

    public static class ModOption {
        private String name;
        private String description;
        private BigDecimal rate;
        private int term;
        private BigDecimal payment;
        private BigDecimal savings;
        private boolean partialClaim;
        private BigDecimal partialClaimAmount;
        private boolean paymentSupplement;
        private BigDecimal supplementAmount;

        public ModOption() {}

        public ModOption(String name, String description, BigDecimal rate, int term,
                         BigDecimal payment, BigDecimal savings,
                         boolean partialClaim, BigDecimal partialClaimAmount,
                         boolean paymentSupplement, BigDecimal supplementAmount) {
            this.name = name;
            this.description = description;
            this.rate = rate;
            this.term = term;
            this.payment = payment;
            this.savings = savings;
            this.partialClaim = partialClaim;
            this.partialClaimAmount = partialClaimAmount;
            this.paymentSupplement = paymentSupplement;
            this.supplementAmount = supplementAmount;
        }

        public String getName() { return name; }
        public String getDescription() { return description; }
        public BigDecimal getRate() { return rate; }
        public int getTerm() { return term; }
        public String getTermDisplay() {
            if (term == 0) return "Remaining";
            return (term / 12) + " years";
        }
        public BigDecimal getPayment() { return payment; }
        public BigDecimal getSavings() { return savings; }
        public boolean isPartialClaim() { return partialClaim; }
        public BigDecimal getPartialClaimAmount() { return partialClaimAmount; }
        public boolean isPaymentSupplement() { return paymentSupplement; }
        public BigDecimal getSupplementAmount() { return supplementAmount; }
    }
}
