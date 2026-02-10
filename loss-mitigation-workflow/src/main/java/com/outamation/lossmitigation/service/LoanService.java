package com.outamation.lossmitigation.service;

import com.outamation.lossmitigation.model.Loan;
import com.outamation.lossmitigation.repository.LoanRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class LoanService {

    private final LoanRepository loanRepository;

    public LoanService(LoanRepository loanRepository) {
        this.loanRepository = loanRepository;
    }

    public Optional<Loan> findByLoanId(String loanId) {
        return loanRepository.findByLoanId(loanId);
    }

    public List<SearchResult> fuzzySearch(String searchTerm) {
        if (searchTerm == null || searchTerm.trim().length() < 2) {
            return Collections.emptyList();
        }

        String term = searchTerm.toLowerCase().trim();
        List<Loan> loans = loanRepository.findAll();
        List<SearchResult> results = new ArrayList<>();

        for (Loan loan : loans) {
            int score = 0;
            String matchType = "";

            // Exact matches
            if (loan.getLoanAccountNumber().equalsIgnoreCase(term)) {
                score = 100;
                matchType = "Exact Match - Loan Number";
            } else if (loan.getLoanId().equalsIgnoreCase(term)) {
                score = 100;
                matchType = "Exact Match - Loan ID";
            } else if (loan.getBorrowerName().equalsIgnoreCase(term)) {
                score = 100;
                matchType = "Exact Match - Borrower Name";
            } else if (loan.getPropertyAddress().equalsIgnoreCase(term)) {
                score = 100;
                matchType = "Exact Match - Property Address";
            }
            // Partial matches
            else if (loan.getLoanAccountNumber().toLowerCase().contains(term)) {
                score = 80;
                matchType = "Partial Match - Loan Number";
            } else if (loan.getLoanId().toLowerCase().contains(term)) {
                score = 80;
                matchType = "Partial Match - Loan ID";
            } else if (loan.getBorrowerName().toLowerCase().contains(term)) {
                score = 75;
                matchType = "Partial Match - Borrower Name";
            } else if (loan.getPropertyAddress().toLowerCase().contains(term)) {
                score = 75;
                matchType = "Partial Match - Property Address";
            }
            // Fuzzy matches
            else {
                String[] searchWords = term.split("\\s+");
                String[] nameWords = loan.getBorrowerName().toLowerCase().split("\\s+");
                for (String sw : searchWords) {
                    for (String nw : nameWords) {
                        if (nw.startsWith(sw) || sw.startsWith(nw)) {
                            score = Math.max(score, 50);
                            matchType = "Fuzzy Match - Borrower Name";
                        }
                    }
                }
                String[] addressParts = loan.getPropertyAddress().toLowerCase().split("[\\s,]+");
                for (String sw : searchWords) {
                    for (String ap : addressParts) {
                        if (ap.startsWith(sw) || sw.startsWith(ap)) {
                            score = Math.max(score, 50);
                            matchType = "Fuzzy Match - Property Address";
                        }
                    }
                }
            }

            if (score > 0) {
                results.add(new SearchResult(loan, score, matchType));
            }
        }

        results.sort(Comparator.comparingInt(SearchResult::getScore).reversed());
        return results;
    }

    public static class SearchResult {
        private final Loan loan;
        private final int score;
        private final String matchType;

        public SearchResult(Loan loan, int score, String matchType) {
            this.loan = loan;
            this.score = score;
            this.matchType = matchType;
        }

        public Loan getLoan() { return loan; }
        public int getScore() { return score; }
        public String getMatchType() { return matchType; }

        public String getScoreColor() {
            if (score == 100) return "#4caf50";
            if (score >= 75) return "#2196f3";
            return "#ff9800";
        }
    }
}
