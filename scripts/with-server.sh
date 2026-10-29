#!/bin/bash
# Self-contained dev server runner: starts server, waits for ready, runs the
# given command, then stops the server. Usage: with-server.sh "<command>"
cd /home/z/my-project
nohup node node_modules/next/dist/bin/next dev -p 3000 > /tmp/dev-run.log 2>&1 &
SERVER_PID=$!
for i in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
  if [ "$code" = "200" ] || [ "$code" = "307" ]; then break; fi
  sleep 1
done
echo "server ready (status $code, pid $SERVER_PID)"
bash -c "$1"
EXIT=$?
kill $SERVER_PID 2>/dev/null
echo "server stopped"
exit $EXIT
