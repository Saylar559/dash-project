export function buildWhereSQL(filterValues: Record<string, any>) {
  const parts: string[] = [];
  for (const field in filterValues) {
    const { op, val } = filterValues[field] || {};
    if (!val) continue;
    if (op === "LIKE")
      parts.push(`"${field}" LIKE '%${val.replace(/'/g, "''")}%'`);
    else
      parts.push(`"${field}" ${op} '${val.replace(/'/g, "''")}'`);
  }
  return parts.length ? ("WHERE " + parts.join(" AND ")) : "";
}
