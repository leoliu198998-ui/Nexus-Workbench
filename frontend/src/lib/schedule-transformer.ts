import { ScheduleApiItem, ScheduleExportItem } from './types/schedule';

export function transformScheduleData(data: ScheduleApiItem[]): ScheduleExportItem[] {
  return data.map((item) => {
    const schedule_id = item.id || '';
    const schedule_name = item.name || '';

    const client_name = item.client?.fullName || '';
    const client_code = item.client?.code || '';

    const entity_name = item.entity?.name || '';
    const location_name = item.location?.name || '';

    const service_type_name = item.serviceType?.name || '';
    const service_module_name = item.serviceModule?.name || '';

    const failure_reason_list = item.failureReason || [];
    const generate_status = item.generateStatus || '';

    // 处理 PUBLIC_HOLIDAY_ERROR 拼接缺失地区
    const missing_locations = item.missingHolidayLocations || [];
    const missing_names = missing_locations
      .map((loc) => loc.name || '')
      .filter(Boolean)
      .join(',');

    const processed_failure: string[] = [];
    for (const fr of failure_reason_list) {
      if (fr === 'PUBLIC_HOLIDAY_ERROR') {
        if (missing_names) {
          processed_failure.push(`${fr}(${missing_names})`);
        } else {
          processed_failure.push(`${fr}(All)`);
        }
      } else {
        processed_failure.push(fr);
      }
    }
    // 过滤掉可能存在的空字符串，尽管逻辑上不太可能出现
    const failure_reason = processed_failure.filter(Boolean).join(',');

    // 联系人信息
    const sd_contacts = item.serviceDeliverContacts || [];
    const sd_contact_names = sd_contacts.map((c) => c.name || '').join(',');

    const local_contacts = item.serviceDeliverLocalProcessContacts || [];
    const local_contact_names = local_contacts.map((c) => c.name || '').join(',');

    return {
      id: schedule_id,
      name: schedule_name,
      clientName: client_name,
      clientCode: client_code,
      entityName: entity_name,
      locationName: location_name,
      serviceType: service_type_name,
      serviceModuleName: service_module_name,
      failureReason: failure_reason,
      generateStatus: generate_status,
      globalSD: sd_contact_names,
      localProcessSD: local_contact_names,
    };
  });
}
