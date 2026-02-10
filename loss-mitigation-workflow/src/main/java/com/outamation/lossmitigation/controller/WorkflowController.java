package com.outamation.lossmitigation.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.outamation.lossmitigation.service.HardshipService;
import com.outamation.lossmitigation.service.LoanService;
import com.outamation.lossmitigation.service.WorkflowService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WorkflowController {

    private final WorkflowService workflowService;
    private final LoanService loanService;
    private final HardshipService hardshipService;
    private final ObjectMapper objectMapper;

    public WorkflowController(WorkflowService workflowService,
                               LoanService loanService,
                               HardshipService hardshipService,
                               ObjectMapper objectMapper) {
        this.workflowService = workflowService;
        this.loanService = loanService;
        this.hardshipService = hardshipService;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("steps", workflowService.getAllSteps());
        model.addAttribute("totalSteps", workflowService.getTotalSteps());

        // Serialize all steps to JSON so the frontend can access full step data
        try {
            String stepsJson = objectMapper.writeValueAsString(workflowService.getAllSteps());
            model.addAttribute("stepsJson", stepsJson);
        } catch (JsonProcessingException e) {
            model.addAttribute("stepsJson", "[]");
        }

        return "workflow";
    }
}
