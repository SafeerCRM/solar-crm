import { registerPlugin } from '@capacitor/core';

type CallControlPlugin = {
  placeCall(options: { number: string }): Promise<void>;
};

export const CallControl = registerPlugin<CallControlPlugin>('CallControl');