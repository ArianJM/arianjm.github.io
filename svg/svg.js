(function() {
    const snap = Snap(800, 600);

    document.getElementById('btn-add-circle').addEventListener('click', () => {
        const circle = snap.circle(Math.random() * 600 - 100, Math.random() * 400 - 100, Math.random() * 50 + 10);

        circle.attr({
            fill: 'green',
            stroke: 'yellow',
            strokeWidth: 3,
        });

        circle.drag((dx, dy, posx, posy) => {
            circle.attr({ cx: posx, cy: posy });
        });

        circle.animate({ transform: 's1.5,1.5' }, 1000)
    });
})();
