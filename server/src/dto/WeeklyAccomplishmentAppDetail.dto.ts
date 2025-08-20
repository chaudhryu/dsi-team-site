// Optional: detail DTO if you return app/server/db info
export class AppServerDto { id: number; hostname: string; }
export class DatabaseLoginDto { id: number; role: string; username: string; }
export class AppDatabaseDto { id: number; name: string; logins: DatabaseLoginDto[]; }

export class WeeklyAccomplishmentAppDetailDto {
  startWeekDate: string;
  endWeekDate: string;
  accomplishments: string;
  applicationName: string;
  devServer?: AppServerDto | null;
  prodServer?: AppServerDto | null;
  devDatabase?: AppDatabaseDto | null;
  prodDatabase?: AppDatabaseDto | null;
}
