import axiosClient from "./axiosClient";

export interface MqttCredentials {
  available: boolean;
  wsUrl?: string;
  investorId?: string;
  token?: string;
  reason?: string;
}

export const dnseApi = {
  getMqttCredentials: () =>
    axiosClient.get<MqttCredentials>("/api/admin/dnse/mqtt-credentials").then((r) => r.data),
};
