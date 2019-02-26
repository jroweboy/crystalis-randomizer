const upload = document.getElementById('pick-file');

upload.addEventListener('change', () => {
  const file = upload.files[0];
  const reader = new FileReader();
  reader.addEventListener('loadend', () => {
    const rom = new Uint8Array(/** @type {!ArrayBuffer} */ (reader.result)).slice(16);
    document.getElementById('filename').textContent = file.name;
    document.getElementById('hash').textContent = read(rom, 0x277d4, 7);
    document.getElementById('seed').textContent = read(rom, 0x277ec, 8);
    document.getElementById('flags').textContent =
        read(rom, 0x277ff, 23) + read(rom, 0x27800, 23);
    if (read(rom, 0x2782f, 23).trim()) {
    document.getElementById('flags').textContent +=
        read(rom, 0x2782f, 23) + read(rom, 0x27830, 23);
    }
    document.getElementById('checksum').textContent =
        read(rom, 0x27885, 4) + read(rom, 0x27886, 4);
  });
  reader.readAsArrayBuffer(file);
});

const read = (arr, index, len) => {
  const chars = [];
  for (let i = 0; i < len; i++) {
    chars.push(String.fromCharCode(arr[index + 2 * i]));
  }
  return chars.join('');
};

const download = (data, name) => {
  const a = document.createElement("a");
  document.body.appendChild(a);
  a.style.display = "none";
  const blob = new Blob([data], {type: "octet/stream"}),
        url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = name;
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};