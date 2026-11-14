// Capture the displayed, player-visible DTO as evidence in addition to replay
// instructions. Imports still use only config/choices; checkpoints are diagnostic.
export function replayExport(session, {state=null,busy=false,playback=false,pending=false}={}) {
  return {
    ...structuredClone(session),
    liveCheckpoint: {
      format:1,
      capturedAt:new Date().toISOString(),
      displayMode:playback?'opponent-playback':busy?'resolving':'live-decision',
      pendingChoice:pending,
      state:state ? structuredClone(state) : null,
    },
  };
}
