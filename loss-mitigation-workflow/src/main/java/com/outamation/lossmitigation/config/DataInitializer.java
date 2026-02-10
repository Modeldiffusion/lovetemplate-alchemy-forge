package com.outamation.lossmitigation.config;

import com.outamation.lossmitigation.model.Loan;
import com.outamation.lossmitigation.model.LossMitigationApplication;
import com.outamation.lossmitigation.repository.LoanRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final LoanRepository loanRepository;

    public DataInitializer(LoanRepository loanRepository) {
        this.loanRepository = loanRepository;
    }

    @Override
    public void run(String... args) {
        if (loanRepository.count() > 0) return;

        // Loan 1: Sarah Johnson
        Loan loan1 = createLoan("LN-2024-001234", "9876543210", "Sarah Johnson", "Michael Johnson",
                "***-**-7890", "456 Oak Avenue, Springfield, IL 62701",
                285000.00, 2150.00, 425.00, 6.25, 95, 3,
                6450.00, 3600.00, 1950.00, 600.00, 300.00,
                "Owner Occupied", "Single Family", true, "Active",
                LocalDate.of(2025, 5, 20), "None", 365000.00, 78.08);
        loanRepository.save(loan1);

        // Loan 2: Robert Martinez (with active LM application)
        Loan loan2 = createLoan("LN-2024-002456", "8765432109", "Robert Martinez", "Maria Martinez",
                "***-**-5432", "123 Maple Street, Chicago, IL 60601",
                320000.00, 2400.00, 500.00, 5.75, 120, 4,
                9600.00, 5200.00, 3100.00, 850.00, 450.00,
                "Owner Occupied", "Single Family", true, "Active",
                LocalDate.of(2025, 4, 15), "None", 395000.00, 81.01);

        LossMitigationApplication lmApp = new LossMitigationApplication();
        lmApp.setLoan(loan2);
        lmApp.setApplicationType("Loan Modification");
        lmApp.setSubmissionDate(LocalDate.of(2024, 12, 1));
        lmApp.setCurrentStatus("Under Review");
        lmApp.setCurrentStage("Document Review");
        lmApp.setAssignedSpecialist("Sarah Johnson");
        lmApp.setSpecialistExtension("4567");
        lmApp.setExpectedDecisionDate(LocalDate.of(2025, 1, 15));
        lmApp.setPendingDocuments(List.of("Bank Statements"));
        lmApp.setReceivedDocuments(List.of("Hardship Affidavit", "Income Documentation"));
        loan2.setActiveLMApplication(lmApp);
        loanRepository.save(loan2);

        // Loan 3: Jennifer Chen
        Loan loan3 = createLoan("LN-2023-008901", "7654321098", "Jennifer Chen", null,
                "***-**-9012", "789 Pine Drive, Austin, TX 78701",
                275000.00, 1950.00, 380.00, 6.50, 60, 2,
                3900.00, 2100.00, 1300.00, 350.00, 150.00,
                "Owner Occupied", "Condominium", true, "Active",
                LocalDate.of(2025, 6, 10), "None", 310000.00, 88.71);
        loanRepository.save(loan3);

        // Loan 4: David Thompson
        Loan loan4 = createLoan("LN-2024-005678", "6543210987", "David Thompson", "Lisa Thompson",
                "***-**-3456", "321 Elm Boulevard, Denver, CO 80201",
                410000.00, 3100.00, 625.00, 5.25, 150, 5,
                15500.00, 8500.00, 5200.00, 1300.00, 500.00,
                "Owner Occupied", "Single Family", true, "Active",
                LocalDate.of(2025, 3, 28), "None", 485000.00, 84.54);
        loanRepository.save(loan4);

        // Loan 5: Amanda Williams (with active LM application)
        Loan loan5 = createLoan("LN-2023-007123", "5432109876", "Amanda Williams", null,
                "***-**-6789", "567 Cedar Lane, Seattle, WA 98101",
                390000.00, 2850.00, 550.00, 6.00, 75, 2,
                5700.00, 3200.00, 1850.00, 450.00, 200.00,
                "Owner Occupied", "Townhouse", true, "Active",
                LocalDate.of(2025, 5, 30), "None", 465000.00, 83.87);

        LossMitigationApplication lmApp2 = new LossMitigationApplication();
        lmApp2.setLoan(loan5);
        lmApp2.setApplicationType("Repayment Plan");
        lmApp2.setSubmissionDate(LocalDate.of(2024, 12, 15));
        lmApp2.setCurrentStatus("Pending Approval");
        lmApp2.setCurrentStage("Underwriting Review");
        lmApp2.setAssignedSpecialist("Michael Rodriguez");
        lmApp2.setSpecialistExtension("3892");
        lmApp2.setExpectedDecisionDate(LocalDate.of(2025, 1, 5));
        lmApp2.setPendingDocuments(List.of());
        lmApp2.setReceivedDocuments(List.of("All Required Documents"));
        loan5.setActiveLMApplication(lmApp2);
        loanRepository.save(loan5);
    }

    private Loan createLoan(String loanId, String accountNumber, String borrowerName,
                             String coborrowerName, String ssn, String address,
                             double upb, double monthlyPayment, double escrow,
                             double rate, int dpd, int monthsDelinquent,
                             double totalDelinquency, double principalPastDue,
                             double interestPastDue, double escrowShortage, double lateCharges,
                             String occupancy, String propertyType, boolean fhaInsured,
                             String foreclosureStatus, LocalDate saleDate,
                             String bankruptcyStatus, double propertyValue, double ltv) {
        Loan loan = new Loan();
        loan.setLoanId(loanId);
        loan.setLoanAccountNumber(accountNumber);
        loan.setBorrowerName(borrowerName);
        loan.setCoborrowerName(coborrowerName);
        loan.setSsn(ssn);
        loan.setPropertyAddress(address);
        loan.setUnpaidPrincipal(BigDecimal.valueOf(upb));
        loan.setMonthlyPayment(BigDecimal.valueOf(monthlyPayment));
        loan.setEscrowPayment(BigDecimal.valueOf(escrow));
        loan.setInterestRate(BigDecimal.valueOf(rate));
        loan.setDaysPastDue(dpd);
        loan.setMonthsDelinquent(monthsDelinquent);
        loan.setTotalDelinquency(BigDecimal.valueOf(totalDelinquency));
        loan.setPrincipalPastDue(BigDecimal.valueOf(principalPastDue));
        loan.setInterestPastDue(BigDecimal.valueOf(interestPastDue));
        loan.setEscrowShortage(BigDecimal.valueOf(escrowShortage));
        loan.setLateCharges(BigDecimal.valueOf(lateCharges));
        loan.setOccupancyStatus(occupancy);
        loan.setPropertyType(propertyType);
        loan.setFhaInsured(fhaInsured);
        loan.setForeclosureStatus(foreclosureStatus);
        loan.setForeclosureSaleDate(saleDate);
        loan.setBankruptcyStatus(bankruptcyStatus);
        loan.setPropertyValue(BigDecimal.valueOf(propertyValue));
        loan.setLtvRatio(BigDecimal.valueOf(ltv));
        return loan;
    }
}
