import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime


def log(text: str) -> None:
    script_name = "STARTER SCRIPT"
    formatted_date = datetime.now().strftime("%d-%m-%Y | %H:%M:%S")

    print(f"[{formatted_date}] [{script_name}] {text}")


class NodeProcess:
    max_ram: int  # max memory in MB
    script: str  # node script to start
    production: bool  # whether the node server is set to production mode
    process: subprocess  # process instance

    def __init__(self, max_ram, script):
        self.max_ram = max_ram
        self.script = script

        # Check if the server is set to production mode
        config_path = os.path.join('configs', 'website-config.json')
        with open(config_path, 'r') as file:
            website_config = json.load(file)
            self.production = website_config["processEnv"] == "production"

    @staticmethod
    def _build():
        log("Starting Next.js build process...")
        try:
            # Check operating system
            npm_command = 'npm.cmd' if os.name == 'nt' else 'npm'
            # Start build
            subprocess.run([npm_command, "run", "build"], check=True, cwd=os.getcwd())
        except Exception as ex:
            log(f"Failed to build {ex}")

    def start(self) -> None:
        # If set to production build before running
        if self.production:
            self._build()

        log("Starting the node process")
        # Start the process
        self.process = subprocess.Popen(
            ["node", f"--max-old-space-size={str(self.max_ram)}", self.script],
            stdout=sys.stdout,
            stderr=subprocess.STDOUT
        )

    def __del__(self):
        if hasattr(self, 'process'):
            self.process.terminate()



if __name__ == '__main__':
    # Setup arguments
    arg_parser = argparse.ArgumentParser()
    arg_parser.add_argument("-m", "--memory", type=int, default=512,
                            help="Max memory that can be allocated to node process")
    arg_parser.add_argument("-r", "--restarts", type=int, default=5,
                            help="Max amount of consecutive attempts to start the node process")
    arg_parser.add_argument("-d", "--delay", type=int, default=3,
                            help="Delay between node process start attempts")
    arg_parser.add_argument("-t", "--timeout", type=int, default=10,
                            help="Amount of time that needs to pass to reset crash counter")
    arg_parser.add_argument("-s", "--script", type=str, default="server.cjs",
                            help="Node script to start")
    args = arg_parser.parse_args()

    # Load arguments
    max_memory = args.memory
    node_script = args.script
    max_restarts = args.restarts
    crash_timeout = args.timeout
    restart_delay = args.delay

    # Create class instance of the process
    node_process = NodeProcess(max_ram=max_memory, script=node_script)

    # Main loop
    restart_count = 0
    last_crash = time.time()
    while restart_count < max_restarts:
        try:
            # Start process
            node_process.start()
            # Wait for process to end
            exit_code = node_process.process.wait()  # Block until process completes

            # Check if process exited cleanly (exit code 0)
            if exit_code == 0:
                break  # Clean exit - no restart

            if time.time() - last_crash > crash_timeout:
                log(f"App was running for {crash_timeout}s, resetting crash counter")
                # Reset crash counter
                restart_count = 0

            # Assign new crash time
            last_crash = time.time()

            # Log crash and wait for delay before restart
            restart_count += 1
            log(f"Crash detected (Exit code: {exit_code})\t\tcrash: {restart_count}/{max_restarts}")

        # Catch exceptions
        except KeyboardInterrupt:
            log("Shutdown requested by user")
            node_process.__del__()
            sys.exit(0)

        except Exception as e:
            log(f"Execution error: {str(e)}")

            if restart_count >= max_restarts:
                log("Max restart attempts reached")
            else:
                # Restart
                log(f"Restarting in {restart_delay}...")
                time.sleep(restart_delay)

    log("Script terminated")
