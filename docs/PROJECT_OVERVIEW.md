# Project Overview

**Volunteer Shift Scheduler** — CSCD602 Advanced Software Engineering, Individual Project-Based Examination, University of Ghana.

## 1. Project Title

**Volunteer Shift Scheduler** — a web application for coordinating volunteer shift sign-ups, capacity, and attendance for a single community organization.

## 2. Problem Statement

Community organizations that coordinate volunteers — NGOs, food banks, event drives — routinely rely on spreadsheets and chat groups to manage who is signed up for what. That approach breaks down in three specific, recurring ways: it is hard to see at a glance who has signed up for a given shift, hard to know when a shift has actually filled up (so coordinators either over-recruit or turn people away late), and hard to spot coverage gaps before a shift is understaffed. None of this requires a large system to fix — it requires a small, correctly-enforced set of rules (capacity limits, no double-booking, a clear record of who showed up) applied consistently, which manual coordination structurally can't guarantee.

This project addresses that problem directly: volunteers browse and sign up for shifts with capacity and schedule-conflict checks enforced by the system rather than by whoever is watching the spreadsheet, and a coordinator manages the roster and attendance record for each shift without manual reconciliation.

## 3. Aim and Objectives

**Aim.** To design, build, test, and deploy a functional web application that replaces manual (spreadsheet/chat-based) volunteer shift coordination with a system that enforces its own rules — capacity, schedule conflicts, and role-based access — at the data layer, not just in the interface.

**Objectives:**

1. Enable a volunteer to register, browse upcoming shifts with accurate remaining capacity, and sign up subject to two enforced constraints: the shift is not at capacity, and the sign-up does not overlap another shift the same volunteer is already confirmed for.
2. Enable a volunteer to cancel their own sign-up and view their full personal shift history (upcoming and past).
3. Enable a coordinator to create and manage shifts, view a per-shift roster, and record attendance (completed / no-show) after a shift occurs.
4. Enforce every access-control rule (who can read or write what) at the database level via Row-Level Security, so the interface is a UX convenience, not the actual security boundary.
5. Apply a defensible software-engineering process within a fixed 48-hour window: requirements gathering before design, effort estimation before implementation, scope discipline against that estimation, and explicit technical debt tracking throughout rather than only at the end.
6. Deploy the system to a publicly accessible URL backed by a real, non-mocked database, and verify every significant behavior (functional, integration, security) against that live deployment rather than assuming it from a passing local test.

## 4. Stakeholders

| Stakeholder | Role in the system | Primary goals | Key pain points this project addresses |
|---|---|---|---|
| **Volunteer** | End user who signs up for and attends shifts | Find a shift that fits their schedule; be confident their sign-up is real (not silently double-booked or over capacity); see their own history | No visibility into whether a shift is actually still open; risk of accidentally double-booking across two chat threads or a spreadsheet |
| **Coordinator** | Staff/organizer who posts shifts and manages volunteers | Post a shift once and trust the sign-up count is accurate; know who to expect; record attendance without manual reconciliation | Manually counting sign-ups from a chat thread; no reliable record of who actually attended |
| **Organization (implicit)** | The community group running the shifts | A working coordination tool without needing to build or pay for one | Same as the two roles above, at an operational level |

Both direct user roles (Volunteer, Coordinator) are modeled explicitly in the system as distinct accounts with distinct permissions — see the SRS (Section 2.2) and the Row-Level Security policies described in Part 2 (Architecture).

## 5. Requirements Analysis

Requirements were gathered directly from the problem statement above, translated into named actors (Section 4) and their interactions with the system, and then into functional and non-functional requirements — not gathered from a live stakeholder interview (this is a single-developer exam project), but structured as if they had been: problem → actors → use cases → functional requirements → prioritization, in that order, before any implementation began.

Each functional requirement was prioritized using **MoSCoW** (Must / Should / Could / Won't), cross-checked against the effort estimation (Part 3) to confirm the Must-have set was actually achievable inside the 48-hour window before implementation started, rather than assumed achievable and adjusted later. The full requirement list, with IDs and priorities, is in the SRS (Part 1, Section 3). Should-have items (FR-09, FR-10, FR-11) were explicitly deferred until every Must-have was complete and verified, then attempted — all three were completed and are covered in the Implementation section (Part on Implementation) and the Testing report (Part 4).
