import { ScheduleApiItem, ScheduleExportItem } from './types/schedule';

/**
 * 格式化日期时间字符串或数字为 YYYY-MM-DD HH:mm:ss 格式
 * @param dateTime 日期时间字符串（支持 ISO 8601 等格式）或数字时间戳（毫秒或秒）
 * @returns 格式化后的日期时间字符串，如果解析失败则返回空字符串
 */
function formatDateTime(dateTime: string | number | undefined): string {
  if (!dateTime && dateTime !== 0) {
    return '';
  }

  // 如果已经是目标格式（YYYY-MM-DD HH:mm:ss），直接返回
  if (typeof dateTime === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTime)) {
    return dateTime;
  }

  // 如果是字符串，提取日期时间部分（移除毫秒和时区信息）
  if (typeof dateTime === 'string') {
    // 通用正则：提取 YYYY-MM-DD 和 HH:mm:ss，忽略后面所有内容
    // 支持格式：2026-02-02T10:30:45.123Z, 2026-02-02T10:30:45+08:00, 2026-02-02 10:30:45+08:00 等
    const match = dateTime.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hours, minutes, seconds] = match;
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }

  // 如果是数字时间戳，使用 Date 对象格式化
  if (typeof dateTime === 'number') {
    try {
      // 如果数字小于 13 位，认为是秒级时间戳，需要乘以 1000
      const timestamp = dateTime < 10000000000 ? dateTime * 1000 : dateTime;
      const date = new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        return '';
      }

      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      const seconds = String(date.getUTCSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch {
      return '';
    }
  }

  return '';
}

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

    const create_time = formatDateTime(item.createTime);

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
      createTime: create_time,
      failureReason: failure_reason,
      generateStatus: generate_status,
      globalSD: sd_contact_names,
      localProcessSD: local_contact_names,
    };
  });
}
