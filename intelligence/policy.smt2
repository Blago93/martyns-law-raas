;; SMT-LIB 2.0 Policy for Martyn's Law 'Reasonably Practicable' Check
;; This policy mathematically verifies if a security measure is legally required
;; based on the Gross Disproportion Factor (GDF).

(set-logic QF_LRA) ;; Logic: Quantifier-Free Linear Real Arithmetic

;; --- Constants Definitions (UK Regulatory Values) ---
(declare-const VPF Real)
(assert (= VPF 2400000.0)) ;; Value of Preventing a Fatality (£2.4m)

(declare-const GDF Real)
(assert (= GDF 10.0)) ;; Gross Disproportion Factor for Terrorism Risk

;; --- Input Variables (Extracted from Venue Context) ---
(declare-const MeasureCost Real)        ;; Cost of implementation + 10yr maintenance
(declare-const BaselineRisk Real)       ;; Pre-mitigation risk (Fatalities/Year)
(declare-const ResidualRisk Real)       ;; Post-mitigation risk
(declare-const VenueCapacity Real)      ;; Standard Tier: 200 - 799

;; --- Derived Calculations ---
(define-fun RiskReduction () Real
  (- BaselineRisk ResidualRisk)
)

(define-fun MonetizedBenefit () Real
  (* RiskReduction VPF)
)

(define-fun DisproportionThreshold () Real
  (* MonetizedBenefit GDF)
)

;; --- The 'Reasonably Practicable' Test ---
;; A measure is MANDATORY if its Cost is LESS than the Disproportion Threshold.
;; If Cost > Threshold, the measure is "Grossly Disproportionate" and optional.

(define-fun IsMandatory () Bool
  (<= MeasureCost DisproportionThreshold)
)

;; --- Tier Validation Constraint ---
;; Ensure we are only applying this logic to Standard Tier venues
(define-fun IsStandardTier () Bool
  (and (>= VenueCapacity 200.0) (<= VenueCapacity 799.0))
)

;; --- Policy Assertion ---
;; The output is valid only if the recommendation status matches the math.
(declare-const RecommendationStatus String) ;; "REQUIRED" or "OPTIONAL"

(assert 
  (=> IsStandardTier
      (ite IsMandatory
           (= RecommendationStatus "REQUIRED")
           (= RecommendationStatus "OPTIONAL")
      )
  )
)
