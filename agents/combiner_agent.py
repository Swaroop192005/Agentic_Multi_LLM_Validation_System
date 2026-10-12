"""
agents/combiner_agent.py
------------------------
The Combiner Agent synthesises the best elements from both LLM responses
into a single, superior final answer.

Responsibilities:
  - Preserve unique insights from both answers
  - Remove contradictions or errors flagged by the Verifier
  - Produce a well-structured, clear, and comprehensive final answer
  - Ensure no critical information from either answer is lost
"""

from __future__ import annotations
from agents.base_agent import BaseAgent


def create_combiner_agent() -> BaseAgent:
    """
    Returns an agent that merges both LLM answers into a single
    refined, high-quality response.

    Role: Answer Synthesiser & Editor
    Model: gemma2:9b - deliberately NOT one of the two generators.

    Why not llama3 (the original choice)
    ------------------------------------
    llama3 is also one of the two answer GENERATORS, so when it combined it was
    always merging its own writing against Mistral's. utils/scoring.py already
    recorded the symptom - final_answer-referenced BERTScore/BLEU/ROUGE were
    "systematically biased toward answer_a because the same model (LLaMA 3) both
    writes answer_a and drafts final_answer as combiner" - but that was only
    worked around by dropping those metrics from the confidence score. The bias
    stayed in the shipped answer.

    training/combiner_bias_analysis.py measured it on all 5000 final rows, with
    position crossed against identity and the judge verdict:

        IDENTITY effect  +18.1 pp toward llama3 (position held fixed, p~1.7e-89)
        POSITION effect  +10.8 pp toward whichever answer sits in slot 1
        length confound  ruled out (r=+0.029; effect persists in length-matched
                         pairs at 61.1%, n=1645, p=2e-19)

    The identity effect ran through selective obedience rather than style
    recognition: the combiner followed the judge 69.4% of the time when the judge
    picked llama3 but only 49.3% when it picked mistral - a 20 pp obedience gap.
    In the 1815 rows where llama3 sat in slot 1 and the judge had picked Mistral,
    the final answer STILL landed closer to llama3 64.0% of the time.

    gemma2:9b is neither generator, nor the verifier (phi3), nor the judge
    (qwen3.5:9b), so it has no answer of its own among the two it merges - the
    identity term is removed by construction rather than reduced. It is also a
    different model family (Google), already local, and in the replay pilot it
    actually respected the 150-word cap below (mean 128, max 151 words) where
    llama3 systematically overshot it (mean 237, max 407).

    NOTE: swapping the combiner model does NOT address the +10.8 pp POSITION
    effect - that is a property of how a transformer reads a prompt, not of model
    identity, and the upstream per-question coin flip only makes it unbiased with
    respect to model identity, not absent. See RESEARCH_LOG.md Section 37.

    This change is safe with respect to every published result: the combiner is
    strictly terminal. compute_weighted_score never takes final_answer as a
    signal, and the combiner runs once AFTER the regeneration loop closes, so the
    5000-question dataset, the 0.72 threshold calibration and the judge-selection
    results are all unaffected.
    """
    return BaseAgent(
        role="Answer Synthesiser & Editor",
        model_name="gemma2:9b",
        temperature=0.4,      # Moderate temperature for fluent, creative synthesis
        num_predict=1000,
        system_prompt=(
            "You are a senior AI editor and synthesiser. You excel at taking "
            "multiple imperfect pieces of writing and crafting a single masterpiece. "
            "You never introduce new information not found in the source answers — "
            "your role is to merge and polish, not invent. The final answer you "
            "produce is presented directly to the end user, so it must be accurate, "
            "clear, and complete. Use well-structured paragraphs or bullet points."
        ),
    )


def build_combiner_prompt(
    query: str,
    answer1: str,
    answer2: str,
    verification: str,
    judgement: str,
) -> str:
    """
    Build the synthesis prompt with all available context.

    Args:
        query:        The original user question.
        answer1:      Whichever answer was in position 1 for this question.
        answer2:      Whichever answer was in position 2 for this question.
        verification: Verifier agent's feedback.
        judgement:    Judge agent's scores and winner decision.

    Returns:
        A structured prompt string for the combiner agent.
    """
    return (
        f"Synthesise a FINAL, DEFINITIVE answer to the question below by merging "
        f"the best parts of both AI responses. Use the verifier feedback to remove "
        f"any incorrect information, and the judge's decision as guidance.\n\n"
        f"QUESTION: {query}\n\n"
        f"--- ANSWER 1 ---\n{answer1}\n\n"
        f"--- ANSWER 2 ---\n{answer2}\n\n"
        f"--- VERIFIER FEEDBACK ---\n{verification}\n\n"
        f"--- JUDGE EVALUATION ---\n{judgement}\n\n"
        f"Your final answer must:\n"
        f"  1. Be more complete than either individual answer\n"
        f"  2. Contain no factual errors (use verifier feedback)\n"
        f"  3. Be well-structured and clearly written\n"
        f"  4. Directly and fully address the original question\n\n"
        f"  5. should contain at most 150 words strictly\n"
        f"Write the final combined answer now:"
    )
