package com.outamation.lossmitigation.model;

import java.math.BigDecimal;

public class ReinstatementBreakdown {

    private BigDecimal principalPastDue;
    private BigDecimal interestPastDue;
    private BigDecimal escrowShortage;
    private BigDecimal lateCharges;
    private BigDecimal foreclosureCosts;
    private BigDecimal attorneyFees;
    private BigDecimal totalReinstatement;

    public ReinstatementBreakdown() {}

    public static ReinstatementBreakdown calculate(Loan loan) {
        ReinstatementBreakdown breakdown = new ReinstatementBreakdown();
        breakdown.principalPastDue = loan.getPrincipalPastDue();
        breakdown.interestPastDue = loan.getInterestPastDue();
        breakdown.escrowShortage = loan.getEscrowShortage();
        breakdown.lateCharges = loan.getLateCharges();
        breakdown.foreclosureCosts = new BigDecimal("850.00");
        breakdown.attorneyFees = new BigDecimal("450.00");
        breakdown.totalReinstatement = breakdown.principalPastDue
                .add(breakdown.interestPastDue)
                .add(breakdown.escrowShortage)
                .add(breakdown.lateCharges)
                .add(breakdown.foreclosureCosts)
                .add(breakdown.attorneyFees);
        return breakdown;
    }

    public BigDecimal getPrincipalPastDue() { return principalPastDue; }
    public BigDecimal getInterestPastDue() { return interestPastDue; }
    public BigDecimal getEscrowShortage() { return escrowShortage; }
    public BigDecimal getLateCharges() { return lateCharges; }
    public BigDecimal getForeclosureCosts() { return foreclosureCosts; }
    public BigDecimal getAttorneyFees() { return attorneyFees; }
    public BigDecimal getTotalReinstatement() { return totalReinstatement; }
}
