import json
import pandas as pd

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

rows = []

for item in data:
    schedule_id = item.get('id', '')
    schedule_name = item.get('name', '')

    client_info = item.get('client', {})
    client_name = client_info.get('fullName', '')
    client_code = client_info.get('code', '')

    entity_info = item.get('entity', {})
    entity_name = entity_info.get('name', '')

    location_info = item.get('location', {})
    location_name = location_info.get('name', '')

    service_type_info = item.get('serviceType', {})
    service_type_name = service_type_info.get('name', '')

    service_module_info = item.get('serviceModule', {})
    service_module_name = service_module_info.get('name', '')

    failure_reason_list = item.get('failureReason', [])

    generate_status = item.get('generateStatus','')

    # 处理 PUBLIC_HOLIDAY_ERROR 拼接缺失地区
    missing_locations = item.get('missingHolidayLocations', [])
    missing_names = ','.join([loc.get('name', '') for loc in missing_locations if loc.get('name')])

    processed_failure = []
    for fr in failure_reason_list:
        if fr == "PUBLIC_HOLIDAY_ERROR":
            if missing_names:
                processed_failure.append(f"{fr}({missing_names})")
            else:
                processed_failure.append(f"{fr}(All)")
        else:
            processed_failure.append(fr)
    failure_reason = ','.join([fr for fr in processed_failure if fr])

    # 联系人信息
    sd_contacts = item.get('serviceDeliverContacts', [])
    sd_contact_names = ','.join([c.get('name', '') for c in sd_contacts])

    local_contacts = item.get('serviceDeliverLocalProcessContacts', [])
    local_contact_names = ','.join([c.get('name', '') for c in local_contacts])

    rows.append({
        'Schedule ID': schedule_id,
        'Schedule Name': schedule_name,
        'Client Name': client_name,
        'Client Code': client_code,
        'Entity Name': entity_name,
        'Location Name': location_name,
        'Service Type': service_type_name,
        'Service Module Name': service_module_name,
        'Failure Reason': failure_reason,
        'Generate Status' : generate_status,
        'Global SD': sd_contact_names,
        'Local Process SD': local_contact_names
    })

# 转成 DataFrame
df = pd.DataFrame(rows)

# 输出 CSV
csv_file = 'schedules_output.csv'
df.to_csv(csv_file, index=False, encoding='utf-8-sig')

# 输出 Excel
excel_file = 'schedules_output.xlsx'
df.to_excel(excel_file, index=False)

print(f"CSV 文件已生成：{csv_file}")
print(f"Excel 文件已生成：{excel_file}")
