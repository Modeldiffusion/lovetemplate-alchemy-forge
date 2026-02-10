package com.outamation.lossmitigation.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String loanId;

    @Column(nullable = false)
    private String loanAccountNumber;

    @Column(nullable = false)
    private String borrowerName;

    private String coborrowerName;

    private String ssn;

    @Column(nullable = false)
    private String propertyAddress;

    @Column(precision = 12, scale = 2)
    private BigDecimal unpaidPrincipal;

    @Column(precision = 10, scale = 2)
    private BigDecimal monthlyPayment;

    @Column(precision = 10, scale = 2)
    private BigDecimal escrowPayment;

    @Column(precision = 5, scale = 2)
    private BigDecimal interestRate;

    private int daysPastDue;

    private int monthsDelinquent;

    @Column(precision = 12, scale = 2)
    private BigDecimal totalDelinquency;

    @Column(precision = 12, scale = 2)
    private BigDecimal principalPastDue;

    @Column(precision = 12, scale = 2)
    private BigDecimal interestPastDue;

    @Column(precision = 12, scale = 2)
    private BigDecimal escrowShortage;

    @Column(precision = 10, scale = 2)
    private BigDecimal lateCharges;

    private String occupancyStatus;

    private String propertyType;

    private boolean fhaInsured;

    private String foreclosureStatus;

    private LocalDate foreclosureSaleDate;

    private String bankruptcyStatus;

    @Column(precision = 12, scale = 2)
    private BigDecimal propertyValue;

    @Column(precision = 6, scale = 2)
    private BigDecimal ltvRatio;

    @OneToOne(mappedBy = "loan", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    private LossMitigationApplication activeLMApplication;

    public Loan() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getLoanId() { return loanId; }
    public void setLoanId(String loanId) { this.loanId = loanId; }

    public String getLoanAccountNumber() { return loanAccountNumber; }
    public void setLoanAccountNumber(String loanAccountNumber) { this.loanAccountNumber = loanAccountNumber; }

    public String getBorrowerName() { return borrowerName; }
    public void setBorrowerName(String borrowerName) { this.borrowerName = borrowerName; }

    public String getCoborrowerName() { return coborrowerName; }
    public void setCoborrowerName(String coborrowerName) { this.coborrowerName = coborrowerName; }

    public String getSsn() { return ssn; }
    public void setSsn(String ssn) { this.ssn = ssn; }

    public String getPropertyAddress() { return propertyAddress; }
    public void setPropertyAddress(String propertyAddress) { this.propertyAddress = propertyAddress; }

    public BigDecimal getUnpaidPrincipal() { return unpaidPrincipal; }
    public void setUnpaidPrincipal(BigDecimal unpaidPrincipal) { this.unpaidPrincipal = unpaidPrincipal; }

    public BigDecimal getMonthlyPayment() { return monthlyPayment; }
    public void setMonthlyPayment(BigDecimal monthlyPayment) { this.monthlyPayment = monthlyPayment; }

    public BigDecimal getEscrowPayment() { return escrowPayment; }
    public void setEscrowPayment(BigDecimal escrowPayment) { this.escrowPayment = escrowPayment; }

    public BigDecimal getInterestRate() { return interestRate; }
    public void setInterestRate(BigDecimal interestRate) { this.interestRate = interestRate; }

    public int getDaysPastDue() { return daysPastDue; }
    public void setDaysPastDue(int daysPastDue) { this.daysPastDue = daysPastDue; }

    public int getMonthsDelinquent() { return monthsDelinquent; }
    public void setMonthsDelinquent(int monthsDelinquent) { this.monthsDelinquent = monthsDelinquent; }

    public BigDecimal getTotalDelinquency() { return totalDelinquency; }
    public void setTotalDelinquency(BigDecimal totalDelinquency) { this.totalDelinquency = totalDelinquency; }

    public BigDecimal getPrincipalPastDue() { return principalPastDue; }
    public void setPrincipalPastDue(BigDecimal principalPastDue) { this.principalPastDue = principalPastDue; }

    public BigDecimal getInterestPastDue() { return interestPastDue; }
    public void setInterestPastDue(BigDecimal interestPastDue) { this.interestPastDue = interestPastDue; }

    public BigDecimal getEscrowShortage() { return escrowShortage; }
    public void setEscrowShortage(BigDecimal escrowShortage) { this.escrowShortage = escrowShortage; }

    public BigDecimal getLateCharges() { return lateCharges; }
    public void setLateCharges(BigDecimal lateCharges) { this.lateCharges = lateCharges; }

    public String getOccupancyStatus() { return occupancyStatus; }
    public void setOccupancyStatus(String occupancyStatus) { this.occupancyStatus = occupancyStatus; }

    public String getPropertyType() { return propertyType; }
    public void setPropertyType(String propertyType) { this.propertyType = propertyType; }

    public boolean isFhaInsured() { return fhaInsured; }
    public void setFhaInsured(boolean fhaInsured) { this.fhaInsured = fhaInsured; }

    public String getForeclosureStatus() { return foreclosureStatus; }
    public void setForeclosureStatus(String foreclosureStatus) { this.foreclosureStatus = foreclosureStatus; }

    public LocalDate getForeclosureSaleDate() { return foreclosureSaleDate; }
    public void setForeclosureSaleDate(LocalDate foreclosureSaleDate) { this.foreclosureSaleDate = foreclosureSaleDate; }

    public String getBankruptcyStatus() { return bankruptcyStatus; }
    public void setBankruptcyStatus(String bankruptcyStatus) { this.bankruptcyStatus = bankruptcyStatus; }

    public BigDecimal getPropertyValue() { return propertyValue; }
    public void setPropertyValue(BigDecimal propertyValue) { this.propertyValue = propertyValue; }

    public BigDecimal getLtvRatio() { return ltvRatio; }
    public void setLtvRatio(BigDecimal ltvRatio) { this.ltvRatio = ltvRatio; }

    public LossMitigationApplication getActiveLMApplication() { return activeLMApplication; }
    public void setActiveLMApplication(LossMitigationApplication activeLMApplication) { this.activeLMApplication = activeLMApplication; }

    public String getShortAddress() {
        if (propertyAddress != null && propertyAddress.contains(",")) {
            return propertyAddress.substring(0, propertyAddress.indexOf(","));
        }
        return propertyAddress;
    }
}
