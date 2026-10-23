"""Base assessment provider interface."""

from abc import ABC, abstractmethod
from app.models.assessment import AssessmentRequest, AssessmentResponse


class BaseAssessmentProvider(ABC):
    """Abstract interface for scam-risk assessment engines."""

    @abstractmethod
    def assess(self, request: AssessmentRequest) -> AssessmentResponse:
        """Evaluate a suspicious interaction description and return a structured assessment."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider identifier."""
        pass

    @property
    @abstractmethod
    def is_mock(self) -> bool:
        """Whether the provider executes local mock heuristics vs live external cloud AI."""
        pass
