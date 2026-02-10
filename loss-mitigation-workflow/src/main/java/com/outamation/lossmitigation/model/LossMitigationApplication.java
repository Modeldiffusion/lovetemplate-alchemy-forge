package com.outamation.lossmitigation.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "lm_applications")
public class LossMitigationApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @OneToOne
    @JoinColumn(name = "loan_id")
    private Loan loan;

    private String applicationType;
    private LocalDate submissionDate;
    private String currentStatus;
    private String currentStage;
    private String assignedSpecialist;
    private String specialistExtension;
    private LocalDate expectedDecisionDate;

    @ElementCollection
    @CollectionTable(name = "pending_documents", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "document_name")
    private List<String> pendingDocuments;

    @ElementCollection
    @CollectionTable(name = "received_documents", joinColumns = @JoinColumn(name = "application_id"))
    @Column(name = "document_name")
    private List<String> receivedDocuments;

    public LossMitigationApplication() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Loan getLoan() { return loan; }
    public void setLoan(Loan loan) { this.loan = loan; }

    public String getApplicationType() { return applicationType; }
    public void setApplicationType(String applicationType) { this.applicationType = applicationType; }

    public LocalDate getSubmissionDate() { return submissionDate; }
    public void setSubmissionDate(LocalDate submissionDate) { this.submissionDate = submissionDate; }

    public String getCurrentStatus() { return currentStatus; }
    public void setCurrentStatus(String currentStatus) { this.currentStatus = currentStatus; }

    public String getCurrentStage() { return currentStage; }
    public void setCurrentStage(String currentStage) { this.currentStage = currentStage; }

    public String getAssignedSpecialist() { return assignedSpecialist; }
    public void setAssignedSpecialist(String assignedSpecialist) { this.assignedSpecialist = assignedSpecialist; }

    public String getSpecialistExtension() { return specialistExtension; }
    public void setSpecialistExtension(String specialistExtension) { this.specialistExtension = specialistExtension; }

    public LocalDate getExpectedDecisionDate() { return expectedDecisionDate; }
    public void setExpectedDecisionDate(LocalDate expectedDecisionDate) { this.expectedDecisionDate = expectedDecisionDate; }

    public List<String> getPendingDocuments() { return pendingDocuments; }
    public void setPendingDocuments(List<String> pendingDocuments) { this.pendingDocuments = pendingDocuments; }

    public List<String> getReceivedDocuments() { return receivedDocuments; }
    public void setReceivedDocuments(List<String> receivedDocuments) { this.receivedDocuments = receivedDocuments; }
}
