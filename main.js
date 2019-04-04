// Search component
const input = Vue.component('search-input', {
    template: '<div class="input"><label>Search:</label><input v-model="searchTerm" @input="onSearchChange"></input></div>',
    data: function () {
        return {
            searchTerm: ''
        }
      },
      methods: {
        onSearchChange: _.debounce(
            function() {
                this.$emit('searchTerm', this.searchTerm)
            }, 400)  
      },
}); // End of search component declaration

// Book component
const book = Vue.component('book', {
    props: ['bookData'],
    template: `<div class="book">
                        <img :src="showImage(bookData)"/>
                        <h4>{{ bookData.volumeInfo.title }}</h4>
                    <p>{{ bookData.volumeInfo.description | truncate }}</p>
                </div>`,
    methods: {
        showImage(bookData) {
            if(!bookData) return;
            return bookData.volumeInfo.imageLinks ? bookData.volumeInfo.imageLinks.thumbnail: 'no-image.png';
        }
    },
    filters: {
        truncate: function(value) {
           if (!value) return;
           value = value.split(" ").splice(0,18).join(" ");
           if(value.split(" ").length>=18) value+='...';
           return value;
        }
      }
}); // End of book component declaration

// List component
const list = Vue.component('list', {
    props: ['listData'],
    components: book,
    template: `<div class="list">
                    <p v-if="(listData.items == null) && (listData != '')" class="error">No results.</p>
                    <book v-for="book in listData.items" :bookData="book"></book>
                </div>`,
}); // End of list component declaration

// Main component
var app = new Vue({ 
    el: '#app',
    components: input,list,
    data: {
        listData: '',
        listIndex: 0,
        searchTerm: ''
    },
    methods: {
        onSearchChange(searchTerm) {
            this.listIndex=0;
            this.searchTerm=searchTerm;
            if(searchTerm == '') 
            {   
                this.listData='';
                return;
            }
            axios
                .get('https://www.googleapis.com/books/v1/volumes?q=intitle:'+this.searchTerm+'&printType=books')
                .then(response => this.listData = response.data,
                      (error) => { console.log(error)});
        },
        scroll () {
            window.onscroll = () => {
              if(Math.ceil(document.body.scrollHeight - document.body.scrollTop) <= document.body.clientHeight)
              {
                  this.listIndex+=10;
                  /* API returns totalItems value with different startIndex given- this 'if' won't work. */
                  /* if(this.listIndex>this.listData.totalItems) return; */
                  axios
                    .get('https://www.googleapis.com/books/v1/volumes?q=intitle:'+this.searchTerm+'&printType=books&startIndex='+this.listIndex)
                    .then(response => 
                        {
                            // console.log("response");
                            if(response.data.items) this.listData.items = this.listData.items.concat(response.data.items);
                        },
                        (error) => { console.log(error) });
              }
            }
        }
    },
    mounted () {
        this.scroll()
    },
    template: `<div>
                    <search-input @searchTerm="onSearchChange"></search-input>
                    <list :listData="listData"></list>
                </div>`   
});  // End of main component declaration

