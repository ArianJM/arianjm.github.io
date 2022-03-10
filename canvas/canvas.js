(function() {
    const objects = [];
    const canvas = document.getElementById('fg-canvas');
    const context = canvas.getContext('2d');

    function createCodeObject(code, x = 0, y = 0) {
        const preEl = document.body.appendChild(document.createElement('pre'));
        const codeEl = preEl.appendChild(document.createElement('code'));

        codeEl.textContent = code;
        hljs.highlightElement(preEl);
        html2canvas(preEl).then(canvas => {
            objects.push({
                element: canvas,
                height: canvas.height,
                width: canvas.width,
                x,
                y,
                z: objects.length,
            });
            context.drawImage(canvas, x, y);
            preEl.remove();
        });

    }

    const cppCode = '#include <iostream>\nusing namespace std;\n\nint main() {\n   int wage;\n\n   wage = 20;\n\n   cout << "Salary is ";\n   cout << wage * 40 * 52;\n   cout << endl;\n\n   return 0;\n}';

    document.getElementById('btn-add-code').addEventListener('click', () => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        createCodeObject(cppCode, x, y);
    });
}
)();
