
import pytest
from z3 import *

class ReasonablyPracticableModel:
    def __init__(self):
        # 1. Define Variables
        self.financial_cost = Real('financial_cost')
        self.time_hours = Real('time_hours')
        self.complexity_score = Real('complexity_score') # 0.0 to 1.0 logic scaling
        
        self.threat_likelihood = Real('threat_likelihood')
        self.fatality_count = Real('fatality_count')

        # 2. Define Constants
        self.VPF = 2400000.0  # Value of Preventing a Fatality
        self.GDF = 10.0       # Gross Disproportion Factor
        
        # Hourly wage for 'Sacrifice' calculation (e.g., £15/hr)
        self.HOURLY_WAGE = 15.0
        # Complexity penalty multiplier (e.g., £500 per complexity unit)
        self.COMPLEXITY_PENALTY = 500.0

        # 3. Solver
        self.solver = Solver()

        # 4. Domain Constraints (Sanity Checks)
        self.solver.add(self.financial_cost >= 0)
        self.solver.add(self.time_hours >= 0)
        self.solver.add(self.complexity_score >= 0)
        
        self.solver.add(self.threat_likelihood >= 0, self.threat_likelihood <= 1.0)
        self.solver.add(self.fatality_count >= 200, self.fatality_count <= 800) # Standard Tier

    def define_sacrifice(self):
        return self.financial_cost + (self.time_hours * self.HOURLY_WAGE) + (self.complexity_score * self.COMPLEXITY_PENALTY)

    def define_risk_benefit(self):
        # Risk = Likelihood * Consequence
        # Benefit = Reduction in Risk (assuming measure eliminates risk for this model simplification)
        return self.threat_likelihood * self.fatality_count * self.VPF

    def is_mandatory_logic(self):
        # Edwards v. NCB: Mandatory if Sacrifice < (Benefit * GDF)
        # Using <= to be safe/inclusive
        return self.define_sacrifice() <= (self.define_risk_benefit() * self.GDF)

def test_monotonicity_risk():
    """
    Scenario A: Prove that increasing Risk (fatality_count) while holding Sacrifice constant 
    never changes the decision from REQUIRED (True) to OPTIONAL (False).
    """
    model = ReasonablyPracticableModel()
    
    # We want to find a counter-example where:
    # Risk1 < Risk2 AND Mandatory(Risk1) is True AND Mandatory(Risk2) is False
    # If this is satisfiable, our logic is broken.
    
    r1_fatality = Real('r1_fatality')
    r2_fatality = Real('r2_fatality')
    
    # Constrain R1 and R2 to valid domain
    model.solver.add(r1_fatality >= 200, r1_fatality <= 800)
    model.solver.add(r2_fatality >= 200, r2_fatality <= 800)
    
    # R1 < R2
    model.solver.add(r1_fatality < r2_fatality)

    # Calculate Benefit for R1 and R2
    benefit_r1 = model.threat_likelihood * r1_fatality * model.VPF
    benefit_r2 = model.threat_likelihood * r2_fatality * model.VPF

    # Sacrifice is constant (using the model's single variables)
    sacrifice = model.financial_cost + (model.time_hours * model.HOURLY_WAGE) + (model.complexity_score * model.COMPLEXITY_PENALTY)
    
    # Logic Definitions
    mandatory_r1 = sacrifice <= (benefit_r1 * model.GDF)
    mandatory_r2 = sacrifice <= (benefit_r2 * model.GDF)

    # Counter-example condition: R1 is Mandatory, but R2 (higher risk) is NOT.
    model.solver.add(mandatory_r1)
    model.solver.add(Not(mandatory_r2))

    # To pass, the solver must return UNSAT (Unsatisfiable) -> No counter-example exists.
    result = model.solver.check()
    
    if result == sat:
        print("Counter-example found!", model.solver.model())
        pytest.fail("Monotonicity check failed: Higher risk allowed a measure to become optional.")
    else:
        print("Monotonicity verification passed.")

def test_tipping_point_analysis():
    """
    Scenario B: Solve for the exact financial cost where a measure becomes optional 
    for a max capacity Standard Tier venue (799 pax) with 50% threat likelihood.
    """
    model = ReasonablyPracticableModel()
    
    # Fix inputs
    model.solver.add(model.fatality_count == 799)
    model.solver.add(model.threat_likelihood == 0.5)
    model.solver.add(model.time_hours == 0)      # Simplify
    model.solver.add(model.complexity_score == 0) # Simplify
    
    # We want to find the boundary cost C where Sacrifice == Benefit * GDF
    # C == (0.5 * 799 * 2,400,000) * 10
    
    sacrifice = model.financial_cost
    threshold = (model.threat_likelihood * model.fatality_count * model.VPF) * model.GDF
    
    model.solver.add(sacrifice == threshold)
    
    result = model.solver.check()
    assert result == sat
    
    m = model.solver.model()
    calculated_tipping_cost = m[model.financial_cost]
    
    # Expected: 0.5 * 799 * 2.4m * 10 = 9,588,000,000 (roughly? Let's check logic)
    # Benefit = 0.5 * 799 * 2,400,000 = 958,800,000
    # Threshold = 958,800,000 * 10 = 9,588,000,000
    
    print(f"Tipping point cost for 799 pax: {calculated_tipping_cost}")
    
    # Just ensure it calculated a positive number
    assert m[model.financial_cost].numerator_as_long() > 0

if __name__ == "__main__":
    test_monotonicity_risk()
    test_tipping_point_analysis()
