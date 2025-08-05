export class AppServerDto {
    id: number;
    hostname: string;
  }
  
  export class DatabaseLoginDto {
    id: number;
    role: string;
    username: string;
  }
  
  export class AppDatabaseDto {
    id: number;
    name: string;
    logins: DatabaseLoginDto[];
  }
  
  export class WeeklyAccomplishmentAppDetailDto {
    weeklyPeriod: string;
    accomplishments: string;
    applicationName: string;
    devServer: AppServerDto;
    prodServer: AppServerDto;
    devDatabase: AppDatabaseDto;
    prodDatabase: AppDatabaseDto;
  }
  