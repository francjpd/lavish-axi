/**
 * Lavish-side adapter for wire-axi protocol integration.
 *
 * Exposes backwards-compatible aliases for names not exported by the upstream
 * wire-axi package (such as WireFrameError, WireSessionManager, and WireChannel).
 */

import { Channel, SessionManager } from "wire-axi";

export class WireFrameError extends Error {
  constructor(message) {
    super(message);
    this.name = "WireFrameError";
  }
}

export class WireChannel extends Channel {}
export class WireSessionManager extends SessionManager {}
