package com.outamation.lossmitigation.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class PartialClaim {

    private boolean eligible;
    private BigDecimal amount;
    private BigDecimal percentOfUPB;
    private String ineligibleReason;

    public PartialClaim() {}

    public static PartialClaim evaluate(Loan loan) {
        PartialClaim pc = new PartialClaim();
        BigDecimal maxPC = loan.getUnpaidPrincipal().multiply(new BigDecimal("0.30"));

        if (loan.getMonthsDelinquent() < 4) {
            pc.eligible = false;
            pc.ineligibleReason = "Must be 4+ months delinquent (currently " + loan.getMonthsDelinquent() + " months)";
            return pc;
        }

        if (loan.getTotalDelinquency().compareTo(maxPC) > 0) {
            pc.eligible = false;
            pc.ineligibleReason = "Arrears exceed 30% of UPB limit";
            return pc;
        }

        pc.eligible = true;
        pc.amount = loan.getTotalDelinquency();
        pc.percentOfUPB = loan.getTotalDelinquency()
                .divide(loan.getUnpaidPrincipal(), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
        return pc;
    }

    public boolean isEligible() { return eligible; }
    public BigDecimal getAmount() { return amount; }
    public BigDecimal getPercentOfUPB() { return percentOfUPB; }
    public String getIneligibleReason() { return ineligibleReason; }
}
