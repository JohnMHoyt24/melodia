EMBEDDING_DIM = 768
"""Dimensionality of artist embeddings - pinned via gemini-embedding-001's outputDimensionality."""

CHARACTERISTIC_NAMES = [
    "energy",
    "valence",
    "melody",
    "aggression",
    "danceability",
    "complexity",
]
"""Fixed vocabulary of LLM-derived characteristic scores, each a float in [0, 1]."""
