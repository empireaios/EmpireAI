# Sourced by package, builder and isolated driver. ERR inheritance captures the
# actual failing command before EXIT cleanup, including pipeline exit statuses.
set -E
capture_command_failure(){
 local status=$1 command=$2 line=$3 source_file=$4 pipeline_status=$5
 python3 "$script/complete-diagnostics.py" command --exit-code "$status" --command "$command" --line "$line" --script "$source_file" --pipeline-status "$pipeline_status" || true
 return "$status"
}
trap 'capture_command_failure "$?" "$BASH_COMMAND" "$LINENO" "${BASH_SOURCE[0]}" "${PIPESTATUS[*]}"' ERR
