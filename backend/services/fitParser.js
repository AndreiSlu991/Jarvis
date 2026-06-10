import fs from 'fs';
import FitParserPkg from 'fit-file-parser';

const FitParser = FitParserPkg.default || FitParserPkg;

export function parseFitFile(filePath) {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: 'km/h',
      lengthUnit: 'km',
      elapsedRecordField: true
    });
    const buffer = fs.readFileSync(filePath);
    parser.parse(buffer, (err, data) => {
      if (err) return reject(new Error(`FIT parse failed: ${err}`));
      const session = data.sessions?.[0] || {};
      const records = data.records || [];
      resolve({
        date: session.start_time || records[0]?.timestamp || new Date().toISOString(),
        sport: session.sport || 'cycling',
        distance: session.total_distance ?? null,
        duration: session.total_elapsed_time ?? null,
        elevation: session.total_ascent ?? null,
        avg_hr: session.avg_heart_rate ?? null,
        max_hr: session.max_heart_rate ?? null,
        avg_speed: session.avg_speed ?? null,
        calories: session.total_calories ?? null,
        track: records
          .filter((r) => r.position_lat != null)
          .map((r) => ({
            lat: r.position_lat,
            lng: r.position_long,
            alt: r.altitude ?? null,
            hr: r.heart_rate ?? null,
            t: r.timestamp
          }))
      });
    });
  });
}
