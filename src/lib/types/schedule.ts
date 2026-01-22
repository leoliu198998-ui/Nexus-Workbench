export interface ScheduleApiItem {
  id: string;
  name: string;
  client?: {
    fullName?: string;
    code?: string;
  };
  entity?: {
    name?: string;
  };
  location?: {
    name?: string;
  };
  serviceType?: {
    name?: string;
  };
  serviceModule?: {
    name?: string;
  };
  failureReason?: string[];
  generateStatus?: string;
  missingHolidayLocations?: Array<{
    name?: string;
  }>;
  serviceDeliverContacts?: Array<{
    name?: string;
  }>;
  serviceDeliverLocalProcessContacts?: Array<{
    name?: string;
  }>;
}

export interface ScheduleExportItem {
  id: string;
  name: string;
  clientName: string;
  clientCode: string;
  entityName: string;
  locationName: string;
  serviceType: string;
  serviceModuleName: string;
  failureReason: string;
  generateStatus: string;
  globalSD: string;
  localProcessSD: string;
}
