#!/bin/sh
cat > /usr/share/nginx/html/env-config.js << EOF
window._env_ = {
  REACT_APP_API_URL: "${REACT_APP_API_URL}",
  REACT_APP_VRP_API_URL: "${REACT_APP_VRP_API_URL}"
};
EOF
exec nginx -g 'daemon off;'
