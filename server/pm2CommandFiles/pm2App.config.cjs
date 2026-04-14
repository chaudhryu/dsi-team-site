// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "its-weekly",

	// ALWAYS use absolute paths for Windows PM2 service
      cwd: "E:/ITSWeekly/server",       // working dir (use forward slashes on Windows)
      script: "E:/ITSWeekly/server/dist/main.js",             // compiled entry
      //exec_mode: "cluster",             // optional; leave fork for SQLite/single instance
      instances: 1,
      watch: false,
      autorestart: true,
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      max_memory_restart: "512M",

      // Logs 
      out_file: "logs/its-weekly.log",
      error_file: "logs/its-weekly-err.log",
      merge_logs: true,
      time: true,

     
	// DEFAULT (if someone starts without --env production)
      env: {
        NODE_ENV: "production",     // <= important
        PORT: "3005",
        DB_SYNC: "false",            // <= belt & suspenders
	DATA_CRED_KEY: "d3kA3amHL04sfqJGH0oWTk/1CJQvbgvwuwiCMOn9jMM=",
      },
      // Use this when start with --env production
      env_production: {
        NODE_ENV: "production",
        PORT: "3005",
	DATA_CRED_KEY: "d3kA3amHL04sfqJGH0oWTk/1CJQvbgvwuwiCMOn9jMM=",
      
      }
    }
  ]
}
