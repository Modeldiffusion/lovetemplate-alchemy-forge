package com.outamation.lossmitigation.repository;

import com.outamation.lossmitigation.model.Loan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    Optional<Loan> findByLoanId(String loanId);

    Optional<Loan> findByLoanAccountNumber(String loanAccountNumber);

    @Query("SELECT l FROM Loan l WHERE " +
           "LOWER(l.loanAccountNumber) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(l.loanId) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(l.borrowerName) LIKE LOWER(CONCAT('%', :term, '%')) OR " +
           "LOWER(l.propertyAddress) LIKE LOWER(CONCAT('%', :term, '%'))")
    List<Loan> searchLoans(@Param("term") String searchTerm);
}
