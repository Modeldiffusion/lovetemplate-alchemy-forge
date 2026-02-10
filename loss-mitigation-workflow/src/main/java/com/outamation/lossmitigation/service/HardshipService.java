package com.outamation.lossmitigation.service;

import com.outamation.lossmitigation.model.HardshipReason;
import com.outamation.lossmitigation.model.HardshipReason.HardshipQuestion;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class HardshipService {

    private final Map<String, Map<String, List<HardshipQuestion>>> hardshipDatabase;

    public HardshipService() {
        hardshipDatabase = new LinkedHashMap<>();
        initTemporaryHardships();
        initPermanentHardships();
    }

    private void initTemporaryHardships() {
        Map<String, List<HardshipQuestion>> temporary = new LinkedHashMap<>();

        temporary.put("Curtailment of Income", List.of(
                new HardshipQuestion(1, "What caused the reduction in income?"),
                new HardshipQuestion(2, "Is the reduction temporary?"),
                new HardshipQuestion(3, "When do you expect income to normalize?"),
                new HardshipQuestion(4, "Can you maintain payments until then?")));

        temporary.put("Unemployment", List.of(
                new HardshipQuestion(1, "When did unemployment begin?"),
                new HardshipQuestion(2, "Are you actively seeking work?"),
                new HardshipQuestion(3, "Are you receiving unemployment benefits?"),
                new HardshipQuestion(4, "Is there other income in the household?")));

        temporary.put("Excessive Obligations", List.of(
                new HardshipQuestion(1, "What additional expenses have increased?"),
                new HardshipQuestion(2, "Are these expenses temporary?"),
                new HardshipQuestion(3, "Have you adjusted your budget?"),
                new HardshipQuestion(4, "Can you continue mortgage payments?")));

        temporary.put("Auto Repairs", List.of(
                new HardshipQuestion(1, "Have repairs impacted your ability to work?"),
                new HardshipQuestion(2, "Are repairs completed?"),
                new HardshipQuestion(3, "When will the vehicle be usable?"),
                new HardshipQuestion(4, "Has income been affected?")));

        temporary.put("Military Service", List.of(
                new HardshipQuestion(1, "Are you on active duty?"),
                new HardshipQuestion(2, "Can you pay during service?"),
                new HardshipQuestion(3, "Who manages finances while deployed?"),
                new HardshipQuestion(4, "Is a Power of Attorney in place?")));

        temporary.put("Distant Employment Transfer", List.of(
                new HardshipQuestion(1, "Is the relocation temporary?"),
                new HardshipQuestion(2, "Has income changed due to transfer?"),
                new HardshipQuestion(3, "Do you plan to return?"),
                new HardshipQuestion(4, "What are your intentions for the property?")));

        temporary.put("Moved / Vacated", List.of(
                new HardshipQuestion(1, "Why did you move from the property?"),
                new HardshipQuestion(2, "Do you intend to return?"),
                new HardshipQuestion(3, "Is the property occupied?"),
                new HardshipQuestion(4, "Do you plan to sell or retain it?")));

        temporary.put("Inability to Rent Property", List.of(
                new HardshipQuestion(1, "Is this a rental property?"),
                new HardshipQuestion(2, "Have you reduced the rent?"),
                new HardshipQuestion(3, "Is demand low in the area?"),
                new HardshipQuestion(4, "Have you considered selling?")));

        temporary.put("Casualty Loss", List.of(
                new HardshipQuestion(1, "Has the property been damaged?"),
                new HardshipQuestion(2, "Was an insurance claim filed?"),
                new HardshipQuestion(3, "Is the home habitable?"),
                new HardshipQuestion(4, "When will repairs be completed?")));

        temporary.put("Servicing / Payment Issue", List.of(
                new HardshipQuestion(1, "Was a payment made?"),
                new HardshipQuestion(2, "When and how was it submitted?"),
                new HardshipQuestion(3, "Do you have proof of payment?"),
                new HardshipQuestion(4, "Is the issue now resolved?")));

        hardshipDatabase.put("Temporary", temporary);
    }

    private void initPermanentHardships() {
        Map<String, List<HardshipQuestion>> permanent = new LinkedHashMap<>();

        permanent.put("Death of Mortgagor", List.of(
                new HardshipQuestion(1, "Can you maintain mortgage payments?"),
                new HardshipQuestion(2, "Do you intend to keep the property?"),
                new HardshipQuestion(3, "Have expenses increased due to the loss?"),
                new HardshipQuestion(4, "Have assumption or refinance options been reviewed?")));

        permanent.put("Illness of Mortgagor", List.of(
                new HardshipQuestion(1, "Has the illness caused permanent income loss?"),
                new HardshipQuestion(2, "Is the condition long-term?"),
                new HardshipQuestion(3, "Has your ability to work changed?"),
                new HardshipQuestion(4, "Can you continue making payments?")));

        permanent.put("Illness of Family Member", List.of(
                new HardshipQuestion(1, "Has caregiving reduced household income?"),
                new HardshipQuestion(2, "Is the condition long-term?"),
                new HardshipQuestion(3, "Have expenses increased?"),
                new HardshipQuestion(4, "Can you sustain the mortgage payment?")));

        permanent.put("Marital Difficulties", List.of(
                new HardshipQuestion(1, "Has the separation/divorce been finalized?"),
                new HardshipQuestion(2, "Who is responsible for the mortgage?"),
                new HardshipQuestion(3, "Will the property be retained or sold?"),
                new HardshipQuestion(4, "Has assumption or refinance been discussed?")));

        permanent.put("Abandonment of Property", List.of(
                new HardshipQuestion(1, "Why was the property abandoned?"),
                new HardshipQuestion(2, "Do you plan to return?"),
                new HardshipQuestion(3, "What is your plan for the property?"),
                new HardshipQuestion(4, "Have liquidation options been reviewed?")));

        permanent.put("Inability to Sell Property", List.of(
                new HardshipQuestion(1, "How long has the property been listed?"),
                new HardshipQuestion(2, "Have you lowered the asking price?"),
                new HardshipQuestion(3, "Have offers been received?"),
                new HardshipQuestion(4, "Have alternatives been discussed?")));

        permanent.put("Bankruptcy", List.of(
                new HardshipQuestion(1, "Has bankruptcy been filed?"),
                new HardshipQuestion(2, "Which chapter was filed?"),
                new HardshipQuestion(3, "Is the mortgage included?"),
                new HardshipQuestion(4, "Are you working with an attorney?")));

        permanent.put("Mortgage Fraud", List.of(
                new HardshipQuestion(1, "Was fraud identified at origination?"),
                new HardshipQuestion(2, "Have authorities been notified?"),
                new HardshipQuestion(3, "Is documentation available?"),
                new HardshipQuestion(4, "When is resolution expected?")));

        permanent.put("Natural Disaster", List.of(
                new HardshipQuestion(1, "Was the property impacted by a disaster?"),
                new HardshipQuestion(2, "Has the area been declared a disaster zone?"),
                new HardshipQuestion(3, "Have relief or insurance claims been filed?"),
                new HardshipQuestion(4, "Is the property currently habitable?")));

        hardshipDatabase.put("Permanent", permanent);
    }

    public List<HardshipReason> getAllReasons() {
        List<HardshipReason> allReasons = new ArrayList<>();
        for (Map.Entry<String, Map<String, List<HardshipQuestion>>> categoryEntry : hardshipDatabase.entrySet()) {
            String category = categoryEntry.getKey();
            for (Map.Entry<String, List<HardshipQuestion>> reasonEntry : categoryEntry.getValue().entrySet()) {
                allReasons.add(new HardshipReason(reasonEntry.getKey(), category, reasonEntry.getValue()));
            }
        }
        return allReasons;
    }

    public List<HardshipReason> getTemporaryReasons() {
        return getAllReasons().stream()
                .filter(r -> "Temporary".equals(r.getCategory()))
                .sorted(Comparator.comparing(HardshipReason::getReason))
                .toList();
    }

    public List<HardshipReason> getPermanentReasons() {
        return getAllReasons().stream()
                .filter(r -> "Permanent".equals(r.getCategory()))
                .sorted(Comparator.comparing(HardshipReason::getReason))
                .toList();
    }

    public HardshipReason findReason(String reason, String category) {
        Map<String, List<HardshipQuestion>> categoryMap = hardshipDatabase.get(category);
        if (categoryMap != null && categoryMap.containsKey(reason)) {
            return new HardshipReason(reason, category, categoryMap.get(reason));
        }
        return null;
    }

    public int getNextStepForHardshipType(String category) {
        if ("Permanent".equals(category)) {
            return 15; // Partial Claim
        }
        return 13; // Forbearance
    }
}
