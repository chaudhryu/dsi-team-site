// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "its-weekly",
      cwd: "E:/ITSWeekly/server",
      script: "E:/ITSWeekly/server/dist/main.js",
      instances: 1,
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      max_memory_restart: "512M",

      // ✅ FIXED: Use absolute paths for logs
      out_file: "E:/ITSWeekly/server/logs/its-weekly.log",
      error_file: "E:/ITSWeekly/server/logs/its-weekly-err.log",
      merge_logs: true,
      time: true,

      env: {
        NODE_ENV: "production",
        PORT: "3005",
        DB_SYNC: "false",
        DATA_CRED_KEY: "d3kA3amHL04sfqJGH0oWTk/1CJQvbgvwuwiCMOn9jMM=",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: "3005",
        DATA_CRED_KEY: "d3kA3amHL04sfqJGH0oWTk/1CJQvbgvwuwiCMOn9jMM=",
      },
    },
  ],
};
