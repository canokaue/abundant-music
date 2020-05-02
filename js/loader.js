

function updateLoaderProgress(progress) {
    if (typeof($) != 'undefined') {
        $('#loader-progress').progressbar('option', 'value', progress);
    }
}
