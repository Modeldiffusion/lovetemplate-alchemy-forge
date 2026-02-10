package com.outamation.lossmitigation.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class RepaymentPlan {

    private boolean eligible;
    private int termMonths;
    private BigDecimal regularPayment;
    private BigDecimal additionalPayment;
    private BigDecimal totalPayment;
    private BigDecimal totalArrears;

    public RepaymentPlan() {}

    public static RepaymentPlan calculate(Loan loan) {
        RepaymentPlan plan = new RepaymentPlan();
        plan.eligible = true;
        plan.termMonths = 12;
        plan.regularPayment = loan.getMonthlyPayment();
        plan.totalArrears = loan.getTotalDelinquency();
        plan.additionalPayment = loan.getTotalDelinquency()
                .divide(BigDecimal.valueOf(plan.termMonths), 2, RoundingMode.HALF_UP);
        plan.totalPayment = plan.regularPayment.add(plan.additionalPayment);
        return plan;
    }

    public boolean isEligible() { return eligible; }
    public int getTermMonths() { return termMonths; }
    public BigDecimal getRegularPayment() { return regularPayment; }
    public BigDecimal getAdditionalPayment() { return additionalPayment; }
    public BigDecimal getTotalPayment() { return totalPayment; }
    public BigDecimal getTotalArrears() { return totalArrears; }
}
