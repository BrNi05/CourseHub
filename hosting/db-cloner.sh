#!/bin/bash

# Error mgmt
set -e
on_error() { echo "Script failed. Error on line: $1. Terminating..."; }
trap 'on_error $LINENO' ERR

# Privilige check
if [[ "$EUID" -ne 0 ]]; then
   echo "Script not running as root. Terminating..."
   exit 1
fi

