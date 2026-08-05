import { COMRT_METADATA_VERSION } from "./paths.js";
import { nextComrtId, type CommunicationStore } from "./communication-store.js";
import type { ChannelType, CommunicationChannel, ComrtInput } from "./types.js";

export class ChannelManager {
  openChannel(store: CommunicationStore, input: ComrtInput): CommunicationChannel {
    const channelType = input.channelType ?? "worker_to_worker";
    const participants = [...(input.participants ?? [])].sort((a, b) => a.localeCompare(b));
    const channelId =
      input.channelId ?? nextComrtId(`chan-${channelType.replace(/_/g, "-")}`);

    const existing = input.channelId ? store.getChannel(input.channelId) : null;
    if (existing) {
      return store.updateChannel(existing.channelId, {
        status: "active",
        participants: participants.length ? participants : existing.participants,
      })!;
    }

    const channel: CommunicationChannel = {
      channelId,
      channelType,
      participants,
      status: "active",
      createdAt: new Date().toISOString(),
      metadataVersion: COMRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };
    return store.saveChannel(channel);
  }

  listChannels(store: CommunicationStore, channelType?: ChannelType) {
    const channels = store.listChannels();
    if (!channelType) return channels;
    return channels.filter((c) => c.channelType === channelType);
  }

  resolveOrCreate(
    store: CommunicationStore,
    input: ComrtInput,
  ): CommunicationChannel {
    if (input.channelId) {
      const existing = store.getChannel(input.channelId);
      if (existing) return existing;
    }

    const channelType = input.channelType ?? this.inferChannelType(input);
    const participants = this.resolveParticipants(input);

    const match = store.listChannels().find((c) => {
      if (c.channelType !== channelType) return false;
      if (c.status === "closed") return false;
      const sorted = [...c.participants].sort((a, b) => a.localeCompare(b));
      const wanted = [...participants].sort((a, b) => a.localeCompare(b));
      return (
        sorted.length === wanted.length && sorted.every((p, i) => p === wanted[i])
      );
    });
    if (match) return match;

    return this.openChannel(store, {
      ...input,
      channelType,
      participants,
      validated: true,
    });
  }

  private inferChannelType(input: ComrtInput): ChannelType {
    if (input.channelType) return input.channelType;
    if (input.sessionId) return "collaboration_session";
    const sender = input.sender ?? "";
    const receiver = input.receiver ?? "";
    if (sender.startsWith("factory-") || receiver.startsWith("factory-")) {
      return "factory_to_factory";
    }
    if (sender.startsWith("runtime-") || receiver.startsWith("runtime-")) {
      return "runtime_service";
    }
    return "worker_to_worker";
  }

  private resolveParticipants(input: ComrtInput): string[] {
    if (input.participants?.length) return [...input.participants];
    const parts: string[] = [];
    if (input.sender) parts.push(input.sender);
    if (input.receiver && input.receiver !== input.sender) parts.push(input.receiver);
    return parts.sort((a, b) => a.localeCompare(b));
  }
}
