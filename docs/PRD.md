# Personal Todo Calendar - Product Requirements Document

Version: v1.0  
Date: 2026-03-12  
Status: Confirmed

## 1. Product Overview

This is a personal Todo web app built with Next.js.  
The app is focused on improving execution by managing tasks in a calendar-first workflow.

## 2. Target User

- Single personal user (self-use only)

## 3. Core Goal

- Improve execution efficiency
- Reduce missed tasks and deadline slips

## 4. MVP Scope

Included in MVP:

1. Task CRUD (create, edit, delete, mark done)
2. Calendar-centric interface (month view as primary)
3. Search and filters
4. Browser reminder notifications
5. Local persistence via `localStorage`

Out of MVP:

1. Login and registration
2. Team collaboration
3. Cloud sync

## 5. Functional Requirements

### 5.1 Task Model

Each Todo contains:

1. `title` (required)
2. `description` (optional)
3. `dueAt` (required, date-time)
4. `priority` (`low | medium | high`)
5. `status` (`todo | done`)
6. `createdAt`
7. `updatedAt`

### 5.2 Task Operations

1. Create a new task
2. Edit task fields
3. Delete task
4. Toggle completion status

### 5.3 Calendar Interface

1. Month view is default
2. Click date to view that day’s tasks
3. Show per-day summary count (total and pending)

### 5.4 Search and Filter

1. Keyword search over title and description
2. Filter by priority
3. Filter by status
4. Filter by date range
5. Combined filters must work together

### 5.5 Reminder Notification

1. Request browser notification permission
2. Trigger reminder before due time (default: 30 minutes)
3. Prevent duplicate reminders for same task instance

## 6. Non-Functional Requirements

1. Local-first architecture with no backend dependency for MVP
2. Responsive layout for desktop and mobile
3. Basic keyboard-friendly form interactions
4. Build and lint must pass

## 7. User Stories

1. As a personal user, I want to view tasks on a calendar so I can plan daily priorities.
2. As a personal user, I want to search and filter tasks so I can quickly focus on actionable items.
3. As a personal user, I want reminder notifications before deadlines so I do not miss important tasks.

## 8. Acceptance Criteria

1. New task appears on calendar immediately after creation.
2. Editing a task updates calendar and list views immediately.
3. Search returns only matching tasks.
4. Combined filters produce correct results.
5. Notification is shown after permission is granted and task is near due time.

## 9. Technical Constraints

1. Framework: Next.js (App Router) + TypeScript
2. Storage: browser `localStorage`
3. No authentication in MVP
4. No external database in MVP

## 10. Milestone Plan (2 Weeks)

1. Week 1: Project setup, task CRUD, calendar month view, local storage
2. Week 2: Search/filter, reminder notification, UI polish, validation

