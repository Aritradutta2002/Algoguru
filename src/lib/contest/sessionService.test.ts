import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDevLocalContestSessionService } from "@/lib/contest/devLocalContestSessionService";
import { isContestServiceError } from "@/lib/contest/sessionService";
import { CODING_CONTEST_CONFIG } from "@/lib/contest/config";
import { MAX_EXAM_WARNINGS } from "@/lib/examConstants";

const START = new Date("2026-09-30T12:00:00Z").getTime();
let clock = START;

function makeService() {
  clock = START;
  return createDevLocalContestSessionService({
    userId: "user-1",
    now: () => clock,
    random: () => 0.9,
  });
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  window.localStorage.clear();
});

describe("devLocalContestSessionService", () => {
  it("creates a contest that lasts exactly thirty minutes", async () => {
    const service = makeService();
    const { session } = await service.createSession();
    expect(session.durationSeconds).toBe(30 * 60);
    expect(session.expiresAt - session.startedAt).toBe(30 * 60 * 1000);
    expect(session.status).toBe("active");
    expect(session.language).toBe("java");
  });

  it("assigns two or three distinct published problems", async () => {
    const service = makeService();
    const { problems, session } = await service.createSession();
    expect(problems.length).toBeGreaterThanOrEqual(2);
    expect(problems.length).toBeLessThanOrEqual(3);
    expect(new Set(problems.map((p) => p.id)).size).toBe(problems.length);
    expect(session.problemIds).toEqual(problems.map((p) => p.id));
    for (const problem of problems) {
      expect(problem.visibleTestCases.length).toBeGreaterThan(0);
      expect(problem.isPublished).toBe(true);
    }
  });

  it("never leaks hidden test data in a bundle", async () => {
    const service = makeService();
    const { problems } = await service.createSession();
    const serialised = JSON.stringify(problems);
    expect(serialised).not.toContain("hiddenTestCases");
    expect(serialised).not.toContain("referenceSolution");
  });

  it("returns the in-flight session instead of creating a duplicate", async () => {
    const service = makeService();
    const first = await service.createSession();
    const second = await service.createSession();
    expect(second.session.id).toBe(first.session.id);
    expect(second.problems).toHaveLength(first.problems.length);
  });

  it("allows a new contest once the previous one is finalized", async () => {
    const service = makeService();
    const first = await service.createSession();
    await service.finalize(first.session.id, "manual");
    const second = await service.createSession();
    expect(second.session.id).not.toBe(first.session.id);
  });

  it("stores drafts per problem independently", async () => {
    const service = makeService();
    const { session, problems } = await service.createSession();
    await service.saveDraft(session.id, problems[0].id, "// first");
    await service.saveDraft(session.id, problems[1].id, "// second");

    const reloaded = await service.getSession(session.id);
    expect(reloaded.drafts[problems[0].id]).toBe("// first");
    expect(reloaded.drafts[problems[1].id]).toBe("// second");
  });

  it("rejects draft writes once the contest is closed", async () => {
    const service = makeService();
    const { session, problems } = await service.createSession();
    await service.finalize(session.id, "manual");
    await expect(
      service.saveDraft(session.id, problems[0].id, "// late"),
    ).rejects.toSatisfy(
      (error: unknown) => isContestServiceError(error) && error.code === "conflict",
    );
  });

  it("escalates warnings and ends the contest at the limit", async () => {
    const service = makeService();
    const { session } = await service.createSession();
    let ack = await service.recordWarning(session.id, "fullscreen");
    expect(ack.warningCount).toBe(1);
    expect(ack.finalised).toBe(false);

    for (let index = 1; index < MAX_EXAM_WARNINGS; index += 1) {
      ack = await service.recordWarning(session.id, "blur");
    }
    expect(ack.warningCount).toBe(MAX_EXAM_WARNINGS);
    expect(ack.finalised).toBe(true);
    expect(ack.session.status).toBe("finalized");
    expect(ack.session.finalizationReason).toBe("warning_limit");
  });

  it("finalizes only once and keeps the original reason", async () => {
    const service = makeService();
    const { session } = await service.createSession();
    const first = await service.finalize(session.id, "manual");
    expect(first.alreadyFinalized).toBe(false);
    expect(first.session.finalizationReason).toBe("manual");
    const submittedAt = first.session.submittedAt;

    clock += 5_000;
    const second = await service.finalize(session.id, "expired");
    expect(second.alreadyFinalized).toBe(true);
    expect(second.session.finalizationReason).toBe("manual");
    expect(second.session.submittedAt).toBe(submittedAt);
  });

  it("finalizes an expired contest on read, without a finalization call", async () => {
    const service = makeService();
    const { session } = await service.createSession();
    clock = session.expiresAt + 1;
    const reloaded = await service.getSession(session.id);
    expect(reloaded.session.status).toBe("finalized");
    expect(reloaded.session.finalizationReason).toBe("expired");
  });

  it("lets the clock outrank a client-claimed manual finalization", async () => {
    const service = makeService();
    const { session } = await service.createSession();
    clock = session.expiresAt + 1;
    const ack = await service.finalize(session.id, "manual");
    expect(ack.session.finalizationReason).toBe("expired");
  });

  it("restores drafts after a simulated refresh", async () => {
    const service = makeService();
    const { session, problems } = await service.createSession();
    await service.saveDraft(session.id, problems[0].id, "// persisted");
    // A brand new service instance stands in for a full page reload.
    const afterReload = makeService();
    const bundle = await afterReload.getSession(session.id);
    expect(bundle.drafts[problems[0].id]).toBe("// persisted");
    expect(bundle.session.id).toBe(session.id);
    expect(bundle.authoritative).toBe(false);
  });

  it("marks every bundle as non-authoritative", async () => {
    const service = makeService();
    const { session, authoritative } = await service.createSession();
    expect(authoritative).toBe(false);
    const result = await service.getResult(session.id);
    expect(result.authoritative).toBe(false);
    expect(result.session.id).toBe(session.id);
  });

  it("rejects an unknown session id", async () => {
    const service = makeService();
    await expect(service.getSession("nope")).rejects.toSatisfy(
      (error: unknown) => isContestServiceError(error) && error.code === "not_found",
    );
  });

  it("agrees with the shared thirty-minute configuration", () => {
    expect(CODING_CONTEST_CONFIG.durationSeconds).toBe(30 * 60);
    expect(CODING_CONTEST_CONFIG.minProblems).toBe(2);
    expect(CODING_CONTEST_CONFIG.maxProblems).toBe(3);
  });
});
