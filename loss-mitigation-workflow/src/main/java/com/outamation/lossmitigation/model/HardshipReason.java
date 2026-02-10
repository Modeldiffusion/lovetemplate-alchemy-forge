package com.outamation.lossmitigation.model;

import java.util.List;

public class HardshipReason {

    private String reason;
    private String category; // "Temporary" or "Permanent"
    private String hardshipType; // "Short-term" or "Long-term"
    private List<HardshipQuestion> questions;

    public HardshipReason() {}

    public HardshipReason(String reason, String category, List<HardshipQuestion> questions) {
        this.reason = reason;
        this.category = category;
        this.hardshipType = "Temporary".equals(category) ? "Short-term" : "Long-term";
        this.questions = questions;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getCategory() { return category; }
    public void setCategory(String category) {
        this.category = category;
        this.hardshipType = "Temporary".equals(category) ? "Short-term" : "Long-term";
    }

    public String getHardshipType() { return hardshipType; }

    public List<HardshipQuestion> getQuestions() { return questions; }
    public void setQuestions(List<HardshipQuestion> questions) { this.questions = questions; }

    public boolean isDisaster() {
        return "Natural Disaster".equals(reason);
    }

    public static class HardshipQuestion {
        private int seq;
        private String question;

        public HardshipQuestion() {}

        public HardshipQuestion(int seq, String question) {
            this.seq = seq;
            this.question = question;
        }

        public int getSeq() { return seq; }
        public void setSeq(int seq) { this.seq = seq; }
        public String getQuestion() { return question; }
        public void setQuestion(String question) { this.question = question; }
    }
}
