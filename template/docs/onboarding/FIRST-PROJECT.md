# First Project Onboarding

Roadmap task: `AI-NATIVE-HARDENING-V1.1/H7`

Use this document when a team starts its first project from `ai-template`.
The canonical operating playbook is:

```text
ai-knowledge/docs/playbooks/first-client-project-playbook.md
```

## Start Path

1. Confirm the project is a controlled MVP or pilot.
2. Name the sponsor, product owner and HITL approver.
3. Capture intake and non-goals before repository creation.
4. Generate the project with `create-ai-native-app` when a new repository is
   needed.
5. Run generated project validation.
6. Use SDD for the first feature.
7. Select testing profiles, observability mode, evaluation approach and target
   repository security validation.
8. Close locally only after Inspector PASS.
9. Request HITL approval; the agent must not mark HITL approved.

## Template Boundaries

The template prepares project structure and local validation. It does not prove
remote repository security checks, production readiness or client compliance by
itself.

## Required References

* H1 SDD Package
* H2 Project Generator / `create-ai-native-app`
* H3 Runtime Observability Wiring
* H4 Executable Testing Profiles
* H5 Real Evaluation Runs
* H6 Target Repository Security Validation
* H7 First Client Project Playbook

## Stop Conditions

Stop onboarding when sponsor, HITL approver, repository ownership, sensitive
data classification, validation path or Inspector review cannot be established.
