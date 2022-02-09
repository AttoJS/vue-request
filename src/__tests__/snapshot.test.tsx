// import { mount } from '@vue/test-utils';
// import { defineComponent } from 'vue-demi';

// import { RequestConfig } from '../index';

// describe('RequestConfig', () => {
//   const Child = defineComponent({
//     setup() {
//       return () => <button>button</button>;
//     },
//   });
//   it('RequestConfig default slots should work ', () => {
//     const wrapperA = mount(
//       defineComponent({
//         setup() {
//           return () => (
//             <RequestConfig config={{ loadingDelay: 0 }}>
//               this is a text
//             </RequestConfig>
//           );
//         },
//       }),
//     );
//     expect(wrapperA.html()).toMatchSnapshot();
//     wrapperA.unmount();

//     const wrapperB = mount(
//       defineComponent({
//         setup() {
//           return () => (
//             <RequestConfig config={{ loadingDelay: 0 }}>
//               this is a text
//               <Child />
//             </RequestConfig>
//           );
//         },
//       }),
//     );
//     expect(wrapperB.html()).toMatchSnapshot();
//   });
// });
