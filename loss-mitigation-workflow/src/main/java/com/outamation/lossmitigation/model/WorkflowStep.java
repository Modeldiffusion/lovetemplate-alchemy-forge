package com.outamation.lossmitigation.model;

import java.util.List;

public class WorkflowStep {

    private int id;
    private String name;
    private String icon;
    private String type; // fetch, decision, validation, action, info, capture
    private String script;
    private List<String> checklist;
    private String apiEndpoint;
    private boolean autoValidate;
    private boolean autoAdvance;
    private int autoAdvanceDelay;
    private boolean isEndState;
    private String endStateType; // success, payment-collection, pending, info, liquidation
    private boolean showSearchInterface;
    private boolean showHardshipCapture;
    private List<Decision> decisions;

    public WorkflowStep() {}

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getScript() { return script; }
    public void setScript(String script) { this.script = script; }

    public List<String> getChecklist() { return checklist; }
    public void setChecklist(List<String> checklist) { this.checklist = checklist; }

    public String getApiEndpoint() { return apiEndpoint; }
    public void setApiEndpoint(String apiEndpoint) { this.apiEndpoint = apiEndpoint; }

    public boolean isAutoValidate() { return autoValidate; }
    public void setAutoValidate(boolean autoValidate) { this.autoValidate = autoValidate; }

    public boolean isAutoAdvance() { return autoAdvance; }
    public void setAutoAdvance(boolean autoAdvance) { this.autoAdvance = autoAdvance; }

    public int getAutoAdvanceDelay() { return autoAdvanceDelay; }
    public void setAutoAdvanceDelay(int autoAdvanceDelay) { this.autoAdvanceDelay = autoAdvanceDelay; }

    public boolean isEndState() { return isEndState; }
    public void setEndState(boolean endState) { isEndState = endState; }

    public String getEndStateType() { return endStateType; }
    public void setEndStateType(String endStateType) { this.endStateType = endStateType; }

    public boolean isShowSearchInterface() { return showSearchInterface; }
    public void setShowSearchInterface(boolean showSearchInterface) { this.showSearchInterface = showSearchInterface; }

    public boolean isShowHardshipCapture() { return showHardshipCapture; }
    public void setShowHardshipCapture(boolean showHardshipCapture) { this.showHardshipCapture = showHardshipCapture; }

    public List<Decision> getDecisions() { return decisions; }
    public void setDecisions(List<Decision> decisions) { this.decisions = decisions; }

    public static class Decision {
        private String label;
        private int next;
        private boolean recommended;

        public Decision() {}

        public Decision(String label, int next) {
            this.label = label;
            this.next = next;
        }

        public Decision(String label, int next, boolean recommended) {
            this.label = label;
            this.next = next;
            this.recommended = recommended;
        }

        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }

        public int getNext() { return next; }
        public void setNext(int next) { this.next = next; }

        public boolean isRecommended() { return recommended; }
        public void setRecommended(boolean recommended) { this.recommended = recommended; }
    }
}
