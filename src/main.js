import { yo } from 'yoo-hoo';

console.log('\n');
yo('Zer0Teams');
console.log('\n');

import('./server.js').then(({ createSer }) => {
    import('./proxy.js').then(({ createCont, opt }) => {
        createSer(createCont, opt.port);
    });
});
